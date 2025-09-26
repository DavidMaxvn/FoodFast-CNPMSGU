package com.fastfood.management.service.impl;

import com.fastfood.management.dto.request.OrderRequest;
import com.fastfood.management.dto.response.OrderResponse;
import com.fastfood.management.entity.*;
import com.fastfood.management.repository.*;
import com.fastfood.management.service.api.InventoryService;
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
    private final InventoryService inventoryService;
    private final WebSocketService webSocketService;

    @Override
    @Transactional
    public OrderResponse createOrder(OrderRequest orderRequest) {
        // Validate address
        Address address = addressRepository.findById(orderRequest.getAddressId())
                .orElseThrow(() -> new EntityNotFoundException("Address not found"));
        
        // Create order
        Order order = Order.builder()
                .customer(address.getUser())
                .status(Order.OrderStatus.CREATED)
                .totalAmount(BigDecimal.ZERO)
                .paymentMethod(Order.PaymentMethod.valueOf(orderRequest.getPaymentMethod()))
                .paymentStatus(Order.PaymentStatus.PENDING)
                .address(address)
                .note(orderRequest.getNote())
                .build();
        
        order = orderRepository.save(order);
        
        // Create order items and calculate total
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
        
        // Check inventory
        if (!inventoryService.checkStock(menuItemQuantities)) {
            throw new IllegalStateException("Some items are out of stock");
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
        
        // Send WebSocket notification
        webSocketService.sendOrderStatusUpdate(order.getId(), order.getStatus().name());
        
        // Convert to response
        return mapOrderToResponse(order);
    }

    @Override
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        return mapOrderToResponse(order);
    }

    @Override
    public Page<OrderResponse> getMyOrders(Pageable pageable) {
        // This would use SecurityContextHolder to get current user in a real implementation
        User currentUser = getCurrentUser();
        Page<Order> orders = orderRepository.findByCustomer(currentUser, pageable);
        return orders.map(this::mapOrderToResponse);
    }

    @Override
    public Page<OrderResponse> getOrdersByStatus(Order.OrderStatus status, Pageable pageable) {
        Page<Order> orders = orderRepository.findByStatus(status, pageable);
        return orders.map(this::mapOrderToResponse);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, Order.OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        
        Order.OrderStatus oldStatus = order.getStatus();
        
        // Validate status transition
        validateStatusTransition(oldStatus, status);
        
        // Handle inventory based on status
        if (status == Order.OrderStatus.PREPARING) {
            // Reserve inventory
            Map<Long, Integer> menuItemQuantities = order.getOrderItems().stream()
                    .collect(Collectors.toMap(
                            item -> item.getMenuItem().getId(),
                            OrderItem::getQuantity
                    ));
            
            if (!inventoryService.reserveStock(menuItemQuantities)) {
                throw new IllegalStateException("Failed to reserve inventory");
            }
        } else if (status == Order.OrderStatus.READY_FOR_DELIVERY) {
            // Commit inventory reservation
            Map<Long, Integer> menuItemQuantities = order.getOrderItems().stream()
                    .collect(Collectors.toMap(
                            item -> item.getMenuItem().getId(),
                            OrderItem::getQuantity
                    ));
            
            if (!inventoryService.commitReservation(menuItemQuantities)) {
                throw new IllegalStateException("Failed to commit inventory reservation");
            }
        }
        
        // Update order status
        order.setStatus(status);
        order = orderRepository.save(order);
        
        // Create order activity
        OrderActivity activity = OrderActivity.builder()
                .order(order)
                .actor(getCurrentUser())
                .fromStatus(oldStatus)
                .toStatus(status)
                .build();
        orderActivityRepository.save(activity);
        
        // Send WebSocket notification
        webSocketService.sendOrderStatusUpdate(order.getId(), order.getStatus().name());
        
        return mapOrderToResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long id, String reason) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        
        // Check if order can be cancelled
        if (order.getStatus() == Order.OrderStatus.DELIVERED || 
            order.getStatus() == Order.OrderStatus.CANCELLED || 
            order.getStatus() == Order.OrderStatus.REJECTED) {
            throw new IllegalStateException("Order cannot be cancelled in current state");
        }
        
        Order.OrderStatus oldStatus = order.getStatus();
        
        // Release inventory if reserved
        if (order.getStatus() == Order.OrderStatus.PREPARING) {
            Map<Long, Integer> menuItemQuantities = order.getOrderItems().stream()
                    .collect(Collectors.toMap(
                            item -> item.getMenuItem().getId(),
                            OrderItem::getQuantity
                    ));
            
            inventoryService.releaseReservation(menuItemQuantities);
        }
        
        // Update order status
        order.setStatus(Order.OrderStatus.CANCELLED);
        order = orderRepository.save(order);
        
        // Create order activity
        OrderActivity activity = OrderActivity.builder()
                .order(order)
                .actor(getCurrentUser())
                .fromStatus(oldStatus)
                .toStatus(Order.OrderStatus.CANCELLED)
                .reason(reason)
                .build();
        orderActivityRepository.save(activity);
        
        // Send WebSocket notification
        webSocketService.sendOrderStatusUpdate(order.getId(), order.getStatus().name());
        
        return mapOrderToResponse(order);
    }
    
    // Helper methods
    
    private void validateStatusTransition(Order.OrderStatus currentStatus, Order.OrderStatus newStatus) {
        // Implement status transition validation logic
        // This is a simplified version
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