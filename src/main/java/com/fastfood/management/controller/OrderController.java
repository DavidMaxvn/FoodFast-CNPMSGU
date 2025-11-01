package com.fastfood.management.controller;

import com.fastfood.management.dto.request.OrderRequest;
import com.fastfood.management.dto.response.OrderResponse;
import com.fastfood.management.entity.Order;
import com.fastfood.management.entity.User;
import com.fastfood.management.entity.DroneAssignment;
import com.fastfood.management.entity.Delivery;
import com.fastfood.management.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import com.fastfood.management.service.api.OrderService;
import com.fastfood.management.service.api.FleetService;
import com.fastfood.management.service.api.DroneSimulator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;
    private final FleetService fleetService;
    private final DroneSimulator droneSimulator;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createOrder(
            @Valid @RequestBody OrderRequest orderRequest,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        User currentUser = resolveCurrentUser(principal);
        Order order = orderService.createOrder(orderRequest, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getOrderById(@PathVariable Long id, @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        User currentUser = resolveCurrentUser(principal);
        Order order = orderService.getOrderById(id, currentUser);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> getMyOrders(
            @RequestParam(value = "userId", required = false) Long userId,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        User currentUser = resolveUser(principal, userId);
        List<Order> orders = orderService.listMyOrders(currentUser);
        return ResponseEntity.ok(orders);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> cancelOrder(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        User currentUser = resolveCurrentUser(principal);
        orderService.cancelOrder(id, reason, currentUser);
        return ResponseEntity.ok(Map.of("message", "Huỷ đơn hàng thành công"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MERCHANT', 'STAFF', 'ADMIN')")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam("status") String status,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        User currentUser = resolveCurrentUser(principal);
        Order.OrderStatus targetStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        Order updatedOrder = orderService.updateOrderStatus(id, targetStatus, currentUser);
        return ResponseEntity.ok(updatedOrder);
    }

    // Merchant view: list orders by status with pagination
    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('MERCHANT', 'STAFF', 'ADMIN')")
    public ResponseEntity<Page<OrderResponse>> getOrdersByStatus(
            @RequestParam("status") String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        Order.OrderStatus queryStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        User currentUser = resolveCurrentUser(principal);
        Page<OrderResponse> orders = orderService.getOrdersByStatusForUser(queryStatus, currentUser, PageRequest.of(page, size));
        return ResponseEntity.ok(orders);
    }

    // Auto-assign drone and start delivery simulation
    @PostMapping("/{id}/assign-drone")
    @PreAuthorize("hasAnyRole('MERCHANT', 'STAFF', 'ADMIN')")
    public ResponseEntity<?> assignDroneAndStartDelivery(
            @PathVariable Long id,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        try {
            User currentUser = resolveCurrentUser(principal);
            Order order = orderService.getOrderById(id, currentUser);

            if (order.getStatus() != Order.OrderStatus.READY_FOR_DELIVERY) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Order must be READY_FOR_DELIVERY status"));
            }

            // Auto-assign drone
            var assignment = fleetService.autoAssignDrone(order);
            if (assignment.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No available drones"));
            }

            // Update order status to OUT_FOR_DELIVERY
            orderService.updateOrderStatus(id, Order.OrderStatus.OUT_FOR_DELIVERY, currentUser);

            // Start delivery simulation
            Delivery delivery = assignment.get().getDelivery();
            droneSimulator.startSimulation(delivery.getId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Drone assigned and delivery started",
                    "assignmentId", assignment.get().getId(),
                    "deliveryId", delivery.getId(),
                    "droneId", assignment.get().getDrone().getId()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Get delivery tracking information
    @GetMapping("/{id}/delivery-tracking")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getDeliveryTracking(
            @PathVariable Long id,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        try {
            User currentUser = resolveCurrentUser(principal);
            Order order = orderService.getOrderById(id, currentUser);

            if (order.getDelivery() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No delivery found for this order"));
            }

            Delivery delivery = order.getDelivery();
            Map<String, Object> trackingInfo = Map.of(
                    "orderId", order.getId(),
                    "deliveryId", delivery.getId(),
                    "status", delivery.getStatus().toString(),
                    "currentSegment", delivery.getCurrentSegment(),
                    "etaSeconds", delivery.getEtaSeconds(),
                    "droneId", delivery.getDrone() != null ? delivery.getDrone().getId() : null,
                    "droneSerial", delivery.getDrone() != null ? delivery.getDrone().getSerial() : null,
                    "currentLat", delivery.getDrone() != null ? delivery.getDrone().getCurrentLat() : null,
                    "currentLng", delivery.getDrone() != null ? delivery.getDrone().getCurrentLng() : null
            );

            return ResponseEntity.ok(trackingInfo);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Complete delivery manually (for testing)
    @PostMapping("/{id}/complete-delivery")
    @PreAuthorize("hasAnyRole('MERCHANT', 'STAFF', 'ADMIN')")
    public ResponseEntity<?> completeDelivery(
            @PathVariable Long id,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        try {
            User currentUser = resolveCurrentUser(principal);
            Order order = orderService.getOrderById(id, currentUser);

            if (order.getDelivery() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No delivery found for this order"));
            }

            // Stop simulation
            droneSimulator.stopSimulation(order.getDelivery().getId());

            // Update order status to DELIVERED
            orderService.updateOrderStatus(id, Order.OrderStatus.DELIVERED, currentUser);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Delivery completed successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
    private User resolveCurrentUser(org.springframework.security.core.userdetails.User principal) {
        if (principal == null) {
            throw new EntityNotFoundException("Authenticated principal not found");
        }
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    private User resolveUser(org.springframework.security.core.userdetails.User principal, Long userId) {
        if (userId != null) {
            return userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));
        }
        return resolveCurrentUser(principal);
    }
}