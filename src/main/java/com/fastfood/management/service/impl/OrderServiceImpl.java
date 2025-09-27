package com.fastfood.management.service.impl;

import com.fastfood.management.dto.request.OrderRequest;
import com.fastfood.management.dto.response.OrderResponse;
import com.fastfood.management.entity.*;
import com.fastfood.management.repository.*;
import com.fastfood.management.service.api.OrderService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MenuItemRepository menuItemRepository;
    private final AddressRepository addressRepository;
    private final OrderActivityRepository orderActivityRepository;
    // private final WebSocketService webSocketService;

    @Override
    @Transactional
    public Order createOrder(OrderRequest orderRequest, User currentUser) {
        // Validate address
        Address address = addressRepository.findById(orderRequest.getAddressId())
                .orElseThrow(() -> new EntityNotFoundException("Address not found"));
        
        // Create order
        Order order = Order.builder()
                .customer(currentUser)
                .status(Order.OrderStatus.CREATED)
                .totalAmount(BigDecimal.ZERO)
                .paymentMethod(Order.PaymentMethod.valueOf(orderRequest.getPaymentMethod()))
                .paymentStatus(Order.PaymentStatus.PENDING)
                .address(address)
                .note(orderRequest.getNote())
                .build();
        
        order = orderRepository.save(order);
        
        // tạo order, tính total 
        BigDecimal totalAmount = BigDecimal.ZERO;
        Map<Long, Integer> menuItemQuantities = new HashMap<>();
        
        for (OrderRequest.OrderItemRequest itemRequest : orderRequest.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemRequest.getMenuItemId())
                    .orElseThrow(() -> new EntityNotFoundException("Menu item not found"));
            
            if (!menuItem.isAvailable()) {
                throw new IllegalStateException("Menu item " + menuItem.getName() + " is not available");
            }
            
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .menuItem(menuItem)
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(menuItem.getPrice())
                    .build();
            
            orderItemRepository.save(orderItem);
            
            totalAmount = totalAmount.add(menuItem.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
            menuItemQuantities.put(menuItem.getId(), itemRequest.getQuantity());
        }
        
        // Update order total
        order.setTotalAmount(totalAmount);
        order = orderRepository.save(order);
        
        // Create order activity
        OrderActivity activity = OrderActivity.builder()
                .order(order)
                .fromStatus(null)
                .toStatus(Order.OrderStatus.CREATED)
                .build();
        orderActivityRepository.save(activity);
        
        // Bỏ gửi WebSocket trong phiên bản cơ bản
        // webSocketService.sendOrderStatusUpdate(order.getId(), order.getStatus().name());
        
        return order;
    }

    @Override
    @Transactional
    public Order updateOrderStatus(Long id, Order.OrderStatus status, User currentUser) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        
        Order.OrderStatus oldStatus = order.getStatus();
        
        // Validate status transition
        validateStatusTransition(oldStatus, status);
        
        // Update order status
        order.setStatus(status);
        order = orderRepository.save(order);
        
        // Create order activity
        OrderActivity activity = OrderActivity.builder()
                .order(order)
                .actor(currentUser)
                .fromStatus(oldStatus)
                .toStatus(status)
                .build();
        orderActivityRepository.save(activity);
        
        // Bỏ gửi WebSocket trong phiên bản cơ bản
        // webSocketService.sendOrderStatusUpdate(order.getId(), order.getStatus().name());
        
        return order;
    }

    @Override
    @Transactional
    public void cancelOrder(Long id, String reason, User currentUser) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        
        // Check if user has access to this order
        if (!order.getCustomer().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Access denied: Order does not belong to current user");
        }
        
        // Check if order can be cancelled
        if (order.getStatus() != Order.OrderStatus.CREATED && 
            order.getStatus() != Order.OrderStatus.PENDING_PAYMENT) {
            throw new IllegalStateException("Order cannot be cancelled in current status");
        }
        
        // Update order status
        Order.OrderStatus oldStatus = order.getStatus();
        order.setStatus(Order.OrderStatus.CANCELLED);
        orderRepository.save(order);
        
        // Create order activity
        OrderActivity activity = OrderActivity.builder()
                .order(order)
                .fromStatus(oldStatus)
                .toStatus(Order.OrderStatus.CANCELLED)
                .build();
        orderActivityRepository.save(activity);
        
        // Bỏ gửi WebSocket trong phiên bản cơ bản
        // webSocketService.sendOrderStatusUpdate(order.getId(), order.getStatus().name());
    }
    
    @Override
    public Order getOrderById(Long id, User currentUser) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        
        // Check if user has access to this order
        if (!order.getCustomer().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Access denied: Order does not belong to current user");
        }
        
        return order;
    }

    @Override
    public List<Order> listMyOrders(User currentUser) {
        return orderRepository.findByCustomerOrderByCreatedAtDesc(currentUser);
    }

    @Override
    public Page<OrderResponse> getOrdersByStatus(Order.OrderStatus status, Pageable pageable) {
        Page<Order> orders = orderRepository.findByStatus(status, pageable);
        return orders.map(this::mapOrderToResponse);
    }

    // Helper methods
    
    private void validateStatusTransition(Order.OrderStatus currentStatus, Order.OrderStatus newStatus) {

        switch (currentStatus) {
            case CREATED:
                if (newStatus != Order.OrderStatus.PENDING_PAYMENT && 
                    newStatus != Order.OrderStatus.PAID && 
                    newStatus != Order.OrderStatus.REJECTED) {
                    throw new IllegalStateException("Invalid status transition");
                }
                break;
            case PENDING_PAYMENT:
                if (newStatus != Order.OrderStatus.PAID && 
                    newStatus != Order.OrderStatus.CANCELLED && 
                    newStatus != Order.OrderStatus.REJECTED) {
                    throw new IllegalStateException("Invalid status transition");
                }
                break;
            case PAID:
                if (newStatus != Order.OrderStatus.CONFIRMED && 
                    newStatus != Order.OrderStatus.REJECTED) {
                    throw new IllegalStateException("Invalid status transition");
                }
                break;
            case CONFIRMED:
                if (newStatus != Order.OrderStatus.PREPARING && 
                    newStatus != Order.OrderStatus.REJECTED) {
                    throw new IllegalStateException("Invalid status transition");
                }
                break;
            case PREPARING:
                if (newStatus != Order.OrderStatus.READY_FOR_DELIVERY && 
                    newStatus != Order.OrderStatus.REJECTED) {
                    throw new IllegalStateException("Invalid status transition");
                }
                break;
            case READY_FOR_DELIVERY:
                if (newStatus != Order.OrderStatus.OUT_FOR_DELIVERY) {
                    throw new IllegalStateException("Invalid status transition");
                }
                break;
            case OUT_FOR_DELIVERY:
                if (newStatus != Order.OrderStatus.DELIVERED) {
                    throw new IllegalStateException("Invalid status transition");
                }
                break;
            case DELIVERED:
            case REJECTED:
            case CANCELLED:
                throw new IllegalStateException("Cannot change status of a terminal state");
            default:
                throw new IllegalStateException("Unknown order status");
        }
    }
    
    private User getCurrentUser() {
        // In a real implementation, this would use SecurityContextHolder
        // For now, return null as a placeholder
        return null;
    }
    
    private OrderResponse mapOrderToResponse(Order order) {
        // In a real implementation, this would use MapStruct
        // For now, return a simple implementation
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setStatus(order.getStatus().name());
        response.setTotalAmount(order.getTotalAmount());
        response.setPaymentMethod(order.getPaymentMethod().name());
        response.setPaymentStatus(order.getPaymentStatus().name());
        response.setCreatedAt(order.getCreatedAt());
        return response;
    }
}