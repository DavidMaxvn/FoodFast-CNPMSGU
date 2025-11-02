package com.fastfood.management.controller;

import com.fastfood.management.dto.request.OrderRequest;
import com.fastfood.management.dto.response.OrderCompactResponse;
import com.fastfood.management.mapper.OrderMapper;
import com.fastfood.management.dto.response.OrderResponse;
import com.fastfood.management.entity.Order;
import com.fastfood.management.entity.User;
import com.fastfood.management.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import com.fastfood.management.service.api.OrderService;
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
import java.util.stream.Collectors;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

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
    public ResponseEntity<List<Order>> getMyOrders(
            @RequestParam(value = "userId", required = false) Long userId,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        User currentUser = resolveUser(principal, userId);
        List<Order> orders = orderService.listMyOrders(currentUser);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/me/compact")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<OrderCompactResponse>> getMyOrdersCompact(
            @RequestParam(value = "userId", required = false) Long userId,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        User currentUser = resolveUser(principal, userId);
        List<Order> orders = orderService.listMyOrders(currentUser);
        List<OrderCompactResponse> response = orders.stream()
                .map(OrderMapper::toCompact)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
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
        try {
            Order.OrderStatus targetStatus = Order.OrderStatus.valueOf(status.toUpperCase());
            Order updatedOrder = orderService.updateOrderStatus(id, targetStatus, currentUser);
            return ResponseEntity.ok(updatedOrder);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error", "INVALID_STATUS",
                            "message", "Trạng thái không hợp lệ: " + status
                    ));
        }
    }

    // Merchant view: list orders by status with pagination
    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('MERCHANT', 'STAFF', 'ADMIN')")
    public ResponseEntity<Page<OrderResponse>> getOrdersByStatus(
            @RequestParam("status") String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Order.OrderStatus queryStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        Page<OrderResponse> orders = orderService.getOrdersByStatus(queryStatus, PageRequest.of(page, size));
        return ResponseEntity.ok(orders);
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