package com.fastfood.management.controller;

import com.fastfood.management.entity.Delivery;
import com.fastfood.management.entity.Drone;
import com.fastfood.management.entity.Order;
import com.fastfood.management.repository.DeliveryRepository;
import com.fastfood.management.repository.DroneRepository;
import com.fastfood.management.repository.OrderRepository;
import com.fastfood.management.service.api.DroneSimulator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/simulation")
@RequiredArgsConstructor
@Slf4j
public class DroneSimulationController {

    private final DroneSimulator droneSimulator;
    private final DeliveryRepository deliveryRepository;
    private final DroneRepository droneRepository;
    private final OrderRepository orderRepository;

    /**
     * Start delivery simulation
     */
    @PostMapping("/delivery/{deliveryId}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'MERCHANT', 'STAFF')")
    public ResponseEntity<?> startDeliverySimulation(@PathVariable Long deliveryId) {
        try {
            Delivery delivery = deliveryRepository.findById(deliveryId)
                    .orElseThrow(() -> new IllegalArgumentException("Delivery not found: " + deliveryId));

            if (delivery.getStatus() != Delivery.DeliveryStatus.ASSIGNED) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Delivery must be ASSIGNED status to start simulation"));
            }

            // Start simulation
            droneSimulator.startSimulation(deliveryId);

            // Update delivery status
            delivery.setStatus(Delivery.DeliveryStatus.IN_PROGRESS);
            delivery.setSegmentStartTime(LocalDateTime.now());
            deliveryRepository.save(delivery);

            // Update drone status
            Drone drone = delivery.getDrone();
            drone.setStatus(Drone.DroneStatus.EN_ROUTE_TO_STORE);
            droneRepository.save(drone);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Delivery simulation started",
                    "deliveryId", deliveryId,
                    "droneId", drone.getId()
            ));

        } catch (Exception e) {
            log.error("Error starting simulation for delivery {}: {}", deliveryId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Stop delivery simulation
     */
    @PostMapping("/delivery/{deliveryId}/stop")
    @PreAuthorize("hasAnyRole('ADMIN', 'MERCHANT', 'STAFF')")
    public ResponseEntity<?> stopDeliverySimulation(@PathVariable Long deliveryId) {
        try {
            Delivery delivery = deliveryRepository.findById(deliveryId)
                    .orElseThrow(() -> new IllegalArgumentException("Delivery not found: " + deliveryId));

            // Stop simulation
            droneSimulator.stopSimulation(deliveryId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Delivery simulation stopped",
                    "deliveryId", deliveryId
            ));

        } catch (Exception e) {
            log.error("Error stopping simulation for delivery {}: {}", deliveryId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Complete delivery simulation (mark as delivered)
     */
    @PostMapping("/delivery/{deliveryId}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'MERCHANT', 'STAFF')")
    public ResponseEntity<?> completeDeliverySimulation(@PathVariable Long deliveryId) {
        try {
            Delivery delivery = deliveryRepository.findById(deliveryId)
                    .orElseThrow(() -> new IllegalArgumentException("Delivery not found: " + deliveryId));

            // Stop simulation
            droneSimulator.stopSimulation(deliveryId);

            // Update delivery status
            delivery.setStatus(Delivery.DeliveryStatus.COMPLETED);
            delivery.setUpdatedAt(LocalDateTime.now());
            deliveryRepository.save(delivery);

            // Update order status
            Order order = delivery.getOrder();
            order.setStatus(Order.OrderStatus.DELIVERED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            // Update drone status and position
            Drone drone = delivery.getDrone();
            drone.setStatus(Drone.DroneStatus.IDLE);
            drone.setCurrentLat(drone.getHomeLat());
            drone.setCurrentLng(drone.getHomeLng());
            droneRepository.save(drone);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Delivery completed successfully",
                    "deliveryId", deliveryId,
                    "orderId", order.getId()
            ));

        } catch (Exception e) {
            log.error("Error completing delivery {}: {}", deliveryId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get simulation status for a delivery
     */
    @GetMapping("/delivery/{deliveryId}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getSimulationStatus(@PathVariable Long deliveryId) {
        try {
            Delivery delivery = deliveryRepository.findById(deliveryId)
                    .orElseThrow(() -> new IllegalArgumentException("Delivery not found: " + deliveryId));

            boolean isRunning = droneSimulator.isSimulationRunning(deliveryId);

            Map<String, Object> status = new HashMap<>();
            status.put("deliveryId", deliveryId);
            status.put("isRunning", isRunning);
            status.put("deliveryStatus", delivery.getStatus().toString());
            status.put("currentSegment", delivery.getCurrentSegment());
            status.put("etaSeconds", delivery.getEtaSeconds());

            if (delivery.getDrone() != null) {
                Drone drone = delivery.getDrone();
                status.put("droneId", drone.getId());
                status.put("droneSerial", drone.getSerial());
                status.put("droneStatus", drone.getStatus().toString());
                status.put("currentLat", drone.getCurrentLat());
                status.put("currentLng", drone.getCurrentLng());
                status.put("batteryPct", drone.getBatteryPct());
            }

            return ResponseEntity.ok(status);

        } catch (Exception e) {
            log.error("Error getting simulation status for delivery {}: {}", deliveryId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all active simulations
     */
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'MERCHANT', 'STAFF')")
    public ResponseEntity<?> getActiveSimulations() {
        try {
            List<Delivery> activeDeliveries = deliveryRepository.findByStatus(Delivery.DeliveryStatus.IN_PROGRESS);
            
            List<Map<String, Object>> activeSimulations = activeDeliveries.stream()
                    .filter(delivery -> droneSimulator.isSimulationRunning(delivery.getId()))
                    .map(delivery -> {
                        Map<String, Object> sim = new HashMap<>();
                        sim.put("deliveryId", delivery.getId());
                        sim.put("orderId", delivery.getOrder().getId());
                        sim.put("currentSegment", delivery.getCurrentSegment());
                        sim.put("etaSeconds", delivery.getEtaSeconds());
                        
                        if (delivery.getDrone() != null) {
                            sim.put("droneId", delivery.getDrone().getId());
                            sim.put("droneSerial", delivery.getDrone().getSerial());
                        }
                        
                        return sim;
                    })
                    .toList();

            return ResponseEntity.ok(Map.of(
                    "activeSimulations", activeSimulations,
                    "count", activeSimulations.size()
            ));

        } catch (Exception e) {
            log.error("Error getting active simulations: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Force update delivery progress (for testing)
     */
    @PostMapping("/delivery/{deliveryId}/force-progress")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> forceUpdateProgress(
            @PathVariable Long deliveryId,
            @RequestParam String segment,
            @RequestParam(required = false, defaultValue = "60") Integer etaSeconds) {
        try {
            Delivery delivery = deliveryRepository.findById(deliveryId)
                    .orElseThrow(() -> new IllegalArgumentException("Delivery not found: " + deliveryId));

            // Update delivery progress
            delivery.setCurrentSegment(segment);
            delivery.setEtaSeconds(etaSeconds);
            delivery.setSegmentStartTime(LocalDateTime.now());
            deliveryRepository.save(delivery);

            // Update drone status based on segment
            if (delivery.getDrone() != null) {
                Drone drone = delivery.getDrone();
                switch (segment) {
                    case "W0_W1" -> drone.setStatus(Drone.DroneStatus.EN_ROUTE_TO_STORE);
                    case "W1_W2" -> drone.setStatus(Drone.DroneStatus.EN_ROUTE_TO_CUSTOMER);
                    case "W2_W3" -> drone.setStatus(Drone.DroneStatus.RETURN_TO_BASE);
                }
                droneRepository.save(drone);
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Delivery progress updated",
                    "deliveryId", deliveryId,
                    "segment", segment,
                    "etaSeconds", etaSeconds
            ));

        } catch (Exception e) {
            log.error("Error force updating progress for delivery {}: {}", deliveryId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}