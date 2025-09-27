package com.fastfood.management.controller;

import com.fastfood.management.dto.request.OrderRequest;
import com.fastfood.management.dto.response.OrderResponse;
import com.fastfood.management.entity.Order;
import com.fastfood.management.entity.User;
import com.fastfood.management.repository.UserRepository;
import com.fastfood.management.service.api.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createOrder(
            @Valid @RequestBody OrderRequest orderRequest,
            @RequestParam("userId") Long userId) {
        // Bản cơ bản: nhận userId trực tiếp từ request, nạp User từ DB
        User currentUser = userRepository.findById(userId).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không tìm thấy người dùng"));
        }
        Order order = orderService.createOrder(orderRequest, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id, @RequestParam("userId") Long userId) {
        User currentUser = userRepository.findById(userId).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không tìm thấy người dùng"));
        }
        Order order = orderService.getOrderById(id, currentUser);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyOrders(@RequestParam("userId") Long userId) {
        User currentUser = userRepository.findById(userId).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không tìm thấy người dùng"));
        }
        List<Order> orders = orderService.listMyOrders(currentUser);
        return ResponseEntity.ok(orders);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelOrder(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @RequestParam("userId") Long userId) {
        User currentUser = userRepository.findById(userId).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không tìm thấy người dùng"));
        }
        orderService.cancelOrder(id, reason, currentUser);
        return ResponseEntity.ok(Map.of("message", "Huỷ đơn hàng thành công"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam Order.OrderStatus status,
            @RequestParam("userId") Long userId) {
        User currentUser = userRepository.findById(userId).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không tìm thấy người dùng"));
        }
        Order updatedOrder = orderService.updateOrderStatus(id, status, currentUser);
        return ResponseEntity.ok(updatedOrder);
    }
}