package com.fastfood.management.controller;

import com.fastfood.management.dto.request.DroneAssignmentRequest;
import com.fastfood.management.dto.response.DroneAssignmentResponse;
import com.fastfood.management.entity.Drone;
import com.fastfood.management.entity.DroneAssignment;
import com.fastfood.management.entity.Order;
import com.fastfood.management.repository.DroneRepository;
import com.fastfood.management.repository.OrderRepository;
import com.fastfood.management.service.api.FleetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class DroneController {

    private final DroneRepository droneRepository;
    private final FleetService fleetService;
    private final OrderRepository orderRepository;

    @GetMapping("/drones")
    public ResponseEntity<List<Drone>> listDrones(@RequestParam(value = "status", required = false) Drone.DroneStatus status) {
        if (status != null) {
            return ResponseEntity.ok(droneRepository.findByStatus(status));
        }
        return ResponseEntity.ok(droneRepository.findAll());
    }

    @GetMapping("/drones/available")
    public ResponseEntity<List<Drone>> listAvailable() {
        return ResponseEntity.ok(droneRepository.findByStatus(Drone.DroneStatus.IDLE));
    }
    
    /**
     * POST /assignments/auto - Tự động gán drone cho đơn hàng
     */
    @PostMapping("/assignments/auto")
    public ResponseEntity<?> autoAssignDrone(@RequestParam Long orderId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
            
            if (order.getStatus() != Order.OrderStatus.READY_FOR_DELIVERY) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Order must be READY_FOR_DELIVERY status"));
            }
            
            Optional<DroneAssignment> assignment = fleetService.autoAssignDrone(order);
            
            if (assignment.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "No available drones. Order queued for assignment.",
                    "orderId", orderId
                ));
            }
            
            DroneAssignmentResponse response = buildAssignmentResponse(assignment.get());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Drone assigned successfully",
                "assignment", response
            ));
            
        } catch (Exception e) {
            log.error("Error in auto assignment for order {}: {}", orderId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * POST /assignments/manual - Gán drone thủ công
     */
    @PostMapping("/assignments/manual")
    public ResponseEntity<?> manualAssignDrone(@RequestBody DroneAssignmentRequest request) {
        try {
            Order order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new IllegalArgumentException("Order not found: " + request.getOrderId()));
            
            Drone drone = droneRepository.findById(request.getDroneId())
                    .orElseThrow(() -> new IllegalArgumentException("Drone not found: " + request.getDroneId()));
            
            if (order.getStatus() != Order.OrderStatus.READY_FOR_DELIVERY) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Order must be READY_FOR_DELIVERY status"));
            }
            
            if (drone.getStatus() != Drone.DroneStatus.IDLE) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Drone is not available for assignment"));
            }
            
            DroneAssignment assignment = fleetService.manualAssignDrone(order, drone, "ADMIN"); // TODO: Get from auth
            DroneAssignmentResponse response = buildAssignmentResponse(assignment);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Manual assignment completed",
                "assignment", response
            ));
            
        } catch (Exception e) {
            log.error("Error in manual assignment: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * GET /assignments/drone/{droneId}/current - Lấy assignment hiện tại của drone
     */
    @GetMapping("/assignments/drone/{droneId}/current")
    public ResponseEntity<?> getCurrentAssignment(@PathVariable Long droneId) {
        Optional<DroneAssignment> assignment = fleetService.getCurrentAssignment(droneId);
        
        if (assignment.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "droneId", droneId,
                "hasAssignment", false
            ));
        }
        
        DroneAssignmentResponse response = buildAssignmentResponse(assignment.get());
        return ResponseEntity.ok(Map.of(
            "droneId", droneId,
            "hasAssignment", true,
            "assignment", response
        ));
    }
    
    private DroneAssignmentResponse buildAssignmentResponse(DroneAssignment assignment) {
        Map<String, Double[]> waypoints = Map.of(
            "W0", new Double[]{assignment.getDelivery().getW0Lat(), assignment.getDelivery().getW0Lng()},
            "W1", new Double[]{assignment.getDelivery().getW1Lat(), assignment.getDelivery().getW1Lng()},
            "W2", new Double[]{assignment.getDelivery().getW2Lat(), assignment.getDelivery().getW2Lng()},
            "W3", new Double[]{assignment.getDelivery().getW3Lat(), assignment.getDelivery().getW3Lng()}
        );
        
        return DroneAssignmentResponse.builder()
                .deliveryId(assignment.getDelivery().getId())
                .droneId(assignment.getDrone().getId())
                .orderId(assignment.getOrder().getId())
                .waypoints(waypoints)
                .etaSec(assignment.getDelivery().getEtaSeconds())
                .status(assignment.getDelivery().getStatus().toString())
                .message("Assignment created successfully")
                .build();
    }
}