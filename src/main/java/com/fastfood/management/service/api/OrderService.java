package com.fastfood.management.service.api;

import com.fastfood.management.dto.request.OrderRequest;
import com.fastfood.management.dto.response.OrderResponse;
import com.fastfood.management.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    OrderResponse createOrder(OrderRequest orderRequest);
    OrderResponse getOrderById(Long id);
    Page<OrderResponse> getMyOrders(Pageable pageable);
    Page<OrderResponse> getOrdersByStatus(Order.OrderStatus status, Pageable pageable);
    OrderResponse updateOrderStatus(Long id, Order.OrderStatus status);
    OrderResponse cancelOrder(Long id, String reason);
}