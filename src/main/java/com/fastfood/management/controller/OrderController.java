package com.fastfood.management.controller;

import com.fastfood.management.dto.request.OrderRequest;
import com.fastfood.management.dto.response.OrderResponse;
import com.fastfood.management.entity.Order;
import com.fastfood.management.entity.User;
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
import java.util.Map;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createOrder(
            @Valid @RequestBody OrderRequest orderRequest,
            @AuthenticationPrincipal User currentUser) {
        Order order = orderService.createOrder(orderRequest, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getOrderById(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        Order order = orderService.getOrderById(id, currentUser);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> getMyOrders(@AuthenticationPrincipal User currentUser) {
        List<Order> orders = orderService.listMyOrders(currentUser);
        return ResponseEntity.ok(orders);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> cancelOrder(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal User currentUser) {
        orderService.cancelOrder(id, reason, currentUser);
        return ResponseEntity.ok(Map.of("message", "Huỷ đơn hàng thành công"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MERCHANT', 'STAFF', 'ADMIN')")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam Order.OrderStatus status,
            @AuthenticationPrincipal User currentUser) {
        Order updatedOrder = orderService.updateOrderStatus(id, status, currentUser);
        return ResponseEntity.ok(updatedOrder);
    }

    // Merchant view: list orders by status with pagination
    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('MERCHANT', 'STAFF', 'ADMIN')")
    public ResponseEntity<Page<OrderResponse>> getOrdersByStatus(
            @RequestParam("status") Order.OrderStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Page<OrderResponse> orders = orderService.getOrdersByStatus(status, PageRequest.of(page, size));
        return ResponseEntity.ok(orders);
    }
}