package com.fastfood.management.controller;

import com.fastfood.management.entity.DroneAssignment;
import com.fastfood.management.entity.Order;
import com.fastfood.management.repository.OrderRepository;
import com.fastfood.management.service.api.FleetService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/drone/assignments")
@RequiredArgsConstructor
public class DroneAssignmentController {

    private final FleetService fleetService;
    private final OrderRepository orderRepository;

    @PostMapping("/auto")
    @PreAuthorize("hasAnyRole('ADMIN','MERCHANT','STAFF')")
    public ResponseEntity<?> autoAssign(@RequestBody Map<String, Long> payload) {
        Long orderId = payload.get("orderId");
        if (orderId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "MISSING_ORDER_ID", "message", "orderId is required"));
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));

        return fleetService.autoAssignDrone(order)
                .map(assignment -> ResponseEntity.ok(Map.of(
                        "success", true,
                        "assignmentId", assignment.getId(),
                        "droneId", assignment.getDrone().getId(),
                        "deliveryId", assignment.getDelivery() != null ? assignment.getDelivery().getId() : null
                )))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of("success", false, "message", "No available drones")));
    }
}