package com.fastfood.management.controller;

import com.fastfood.management.entity.Drone;
import com.fastfood.management.entity.DroneAssignment;
import com.fastfood.management.entity.Delivery;
import com.fastfood.management.repository.DroneRepository;
import com.fastfood.management.repository.DroneAssignmentRepository;
import com.fastfood.management.repository.DeliveryRepository;
import com.fastfood.management.service.api.FleetService;
import com.fastfood.management.service.api.DroneSimulator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/drone-management")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class DroneManagementController {

    private final DroneRepository droneRepository;
    private final DroneAssignmentRepository assignmentRepository;
    private final DeliveryRepository deliveryRepository;
    private final FleetService fleetService;
    private final DroneSimulator droneSimulator;

    /**
     * GET /api/drone-management/drones - Lấy danh sách tất cả drone
     */
    @GetMapping("/drones")
    public ResponseEntity<?> getAllDrones() {
        try {
            List<Drone> drones = droneRepository.findAll();
            List<Map<String, Object>> droneList = drones.stream()
                .map(this::buildDroneResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "drones", droneList,
                "total", drones.size()
            ));
        } catch (Exception e) {
            log.error("Error fetching drones: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/drone-management/drones/{id} - Lấy thông tin chi tiết drone
     */
    @GetMapping("/drones/{id}")
    public ResponseEntity<?> getDroneDetail(@PathVariable Long id) {
        try {
            Optional<Drone> droneOpt = droneRepository.findById(id);
            if (droneOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Drone drone = droneOpt.get();
            Map<String, Object> response = buildDroneDetailResponse(drone);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching drone detail: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/drone-management/drones/{id}/status - Cập nhật trạng thái drone
     */
    @PutMapping("/drones/{id}/status")
    public ResponseEntity<?> updateDroneStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            Optional<Drone> droneOpt = droneRepository.findById(id);
            if (droneOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Drone drone = droneOpt.get();
            String newStatus = request.get("status");
            
            if (newStatus == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Status is required"));
            }

            Drone.DroneStatus status = Drone.DroneStatus.valueOf(newStatus);
            drone.setStatus(status);
            droneRepository.save(drone);

            log.info("Updated drone {} status to {}", id, newStatus);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Drone status updated successfully",
                "droneId", id,
                "newStatus", newStatus
            ));
        } catch (Exception e) {
            log.error("Error updating drone status: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/drone-management/drones/{id}/maintenance - Đưa drone vào bảo trì
     */
    @PostMapping("/drones/{id}/maintenance")
    public ResponseEntity<?> setDroneMaintenance(@PathVariable Long id) {
        try {
            Optional<Drone> droneOpt = droneRepository.findById(id);
            if (droneOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Drone drone = droneOpt.get();
            
            // Kiểm tra xem drone có đang thực hiện delivery không
            Optional<DroneAssignment> activeAssignment = fleetService.getCurrentAssignment(id);
            if (activeAssignment.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Cannot set maintenance mode: drone is currently assigned to a delivery"));
            }

            drone.setStatus(Drone.DroneStatus.MAINTENANCE);
            droneRepository.save(drone);

            log.info("Set drone {} to maintenance mode", id);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Drone set to maintenance mode",
                "droneId", id
            ));
        } catch (Exception e) {
            log.error("Error setting drone maintenance: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/drone-management/drones/{id}/activate - Kích hoạt drone từ bảo trì
     */
    @PostMapping("/drones/{id}/activate")
    public ResponseEntity<?> activateDrone(@PathVariable Long id) {
        try {
            Optional<Drone> droneOpt = droneRepository.findById(id);
            if (droneOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Drone drone = droneOpt.get();
            drone.setStatus(Drone.DroneStatus.IDLE);
            droneRepository.save(drone);

            log.info("Activated drone {} from maintenance", id);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Drone activated successfully",
                "droneId", id
            ));
        } catch (Exception e) {
            log.error("Error activating drone: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/drone-management/assignments/active - Lấy danh sách assignment đang hoạt động
     */
    @GetMapping("/assignments/active")
    public ResponseEntity<?> getActiveAssignments() {
        try {
            List<DroneAssignment> activeAssignments = assignmentRepository.findByCompletedAtIsNull();
            List<Map<String, Object>> assignmentList = activeAssignments.stream()
                .map(this::buildAssignmentResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "assignments", assignmentList,
                "total", activeAssignments.size()
            ));
        } catch (Exception e) {
            log.error("Error fetching active assignments: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/drone-management/deliveries/{id}/stop - Dừng delivery simulation
     */
    @PostMapping("/deliveries/{id}/stop")
    public ResponseEntity<?> stopDelivery(@PathVariable Long id) {
        try {
            Optional<Delivery> deliveryOpt = deliveryRepository.findById(id);
            if (deliveryOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            droneSimulator.stopSimulation(id);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Delivery simulation stopped",
                "deliveryId", id
            ));
        } catch (Exception e) {
            log.error("Error stopping delivery: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/drone-management/deliveries/{id}/resume - Tiếp tục delivery simulation
     */
    @PostMapping("/deliveries/{id}/resume")
    public ResponseEntity<?> resumeDelivery(@PathVariable Long id) {
        try {
            Optional<Delivery> deliveryOpt = deliveryRepository.findById(id);
            if (deliveryOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            droneSimulator.startSimulation(id);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Delivery simulation resumed",
                "deliveryId", id
            ));
        } catch (Exception e) {
            log.error("Error resuming delivery: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    // Helper methods
    private Map<String, Object> buildDroneResponse(Drone drone) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", drone.getId());
        response.put("serialNumber", drone.getSerialNumber());
        response.put("model", drone.getModel());
        response.put("status", drone.getStatus().toString());
        response.put("batteryLevel", drone.getBatteryPct());
        response.put("currentLat", drone.getCurrentLat());
        response.put("currentLng", drone.getCurrentLng());
        response.put("homeLat", drone.getHomeLat());
        response.put("homeLng", drone.getHomeLng());
        response.put("maxPayload", drone.getMaxPayloadKg());
        response.put("maxRange", drone.getMaxRangeKm());
        response.put("lastAssignedAt", drone.getLastAssignedAt());
        response.put("isActive", drone.getStatus() != Drone.DroneStatus.MAINTENANCE);
        
        // Thêm thông tin assignment hiện tại nếu có
        Optional<DroneAssignment> currentAssignment = fleetService.getCurrentAssignment(drone.getId());
        if (currentAssignment.isPresent()) {
            DroneAssignment assignment = currentAssignment.get();
            response.put("assignedOrderId", assignment.getOrder().getId());
            response.put("deliveryId", assignment.getDelivery().getId());
        }
        
        return response;
    }

    private Map<String, Object> buildDroneDetailResponse(Drone drone) {
        Map<String, Object> response = buildDroneResponse(drone);
        
        // Thêm thống kê chi tiết
        List<DroneAssignment> completedAssignments = assignmentRepository
            .findByDroneAndCompletedAtIsNotNull(drone);
        
        response.put("totalFlights", completedAssignments.size());
        response.put("flightHours", completedAssignments.size() * 0.5); // Mock calculation
        response.put("lastMaintenance", "2024-01-15"); // Mock data
        
        return response;
    }

    private Map<String, Object> buildAssignmentResponse(DroneAssignment assignment) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", assignment.getId());
        response.put("orderId", assignment.getOrder().getId());
        response.put("droneId", assignment.getDrone().getId());
        response.put("droneSerialNumber", assignment.getDrone().getSerialNumber());
        response.put("assignmentMode", assignment.getAssignmentMode().toString());
        response.put("assignedBy", assignment.getAssignedBy());
        response.put("assignedAt", assignment.getAssignedAt());
        
        if (assignment.getDelivery() != null) {
            Delivery delivery = assignment.getDelivery();
            response.put("deliveryId", delivery.getId());
            response.put("deliveryStatus", delivery.getStatus().toString());
            response.put("currentSegment", delivery.getCurrentSegment());
            response.put("etaSeconds", delivery.getEtaSeconds());
        }
        
        return response;
    }
}