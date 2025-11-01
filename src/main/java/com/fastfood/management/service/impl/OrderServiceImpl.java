package com.fastfood.management.service.impl;

import com.fastfood.management.dto.request.OrderRequest;
import com.fastfood.management.dto.response.OrderResponse;
import com.fastfood.management.entity.*;
import com.fastfood.management.repository.*;
import java.util.UUID;
import com.fastfood.management.service.api.OrderService;
import com.fastfood.management.service.impl.WebSocketService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
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
    private final PaymentRepository paymentRepository;
    private final DeliveryRepository deliveryRepository;
    private final StoreStaffRepository storeStaffRepository;
    private final StoreRepository storeRepository;
    private final WebSocketService webSocketService;

    @Override
    @Transactional
    public Order createOrder(OrderRequest orderRequest, User currentUser) {
        // Validate address
        Address address = addressRepository.findById(orderRequest.getAddressId())
                .orElseThrow(() -> new EntityNotFoundException("Address not found"));
        
        // Determine store from first menu item and validate all items belong to same store
        if (orderRequest.getItems() == null || orderRequest.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item");
        }
        MenuItem firstMenuItem = menuItemRepository.findById(orderRequest.getItems().get(0).getMenuItemId())
                .orElseThrow(() -> new EntityNotFoundException("Menu item not found"));
        Store store = firstMenuItem.getStore();
        if (store == null) {
            throw new IllegalStateException("Menu item does not belong to a store");
        }

        // Create order
        Order order = Order.builder()
                .customer(currentUser)
                .store(store)
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
            // check trạng thái (có sẳn) có bật hay không
            if (!menuItem.isAvailable()) {
                throw new IllegalStateException("Menu item " + menuItem.getName() + " is not available");
            }
            if (menuItem.getStore() == null || !menuItem.getStore().getId().equals(store.getId())) {
                throw new IllegalStateException("All items in an order must belong to the same store");
            }
            
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .menuItem(menuItem)
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(menuItem.getPrice())
                    .nameSnapshot(menuItem.getName())
                    .imageSnapshot(menuItem.getImageUrl())
                    .build();
            
            orderItemRepository.save(orderItem);
            
            totalAmount = totalAmount.add(menuItem.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
            menuItemQuantities.put(menuItem.getId(), itemRequest.getQuantity());
        }
        
        // Update order total
        order.setTotalAmount(totalAmount);
        order = orderRepository.save(order);

        // Auto insert payment record based on payment method
        insertPaymentForOrder(order);

        // KHÔNG tạo Delivery lúc tạo đơn; sẽ tạo khi đơn READY_FOR_DELIVERY

        // Create order activity
        OrderActivity activity = OrderActivity.builder()
                .order(order)
                .fromStatus(Order.OrderStatus.CREATED)
                .toStatus(Order.OrderStatus.CREATED)
                .reason("Order created")
                .build();
        orderActivityRepository.save(activity);
        
        // 
        // webSocketService.sendOrderStatusUpdate(order.getId(), order.getStatus().name());
        
        return order;
    }

    private void insertPaymentForOrder(Order order) {
        if (order.getPaymentMethod() == Order.PaymentMethod.VNPAY || order.getPaymentMethod() == Order.PaymentMethod.WALLET) {
            String provider = order.getPaymentMethod() == Order.PaymentMethod.VNPAY ? "VNPAY" : "WALLET";
            Payment payment = Payment.builder()
                    .order(order)
                    .provider(provider)
                    .amount(order.getTotalAmount())
                    .transactionReference("ORD-" + order.getId() + "-" + UUID.randomUUID().toString().substring(0, 8))
                    .status(Payment.PaymentStatus.PENDING)
                    .build();
            paymentRepository.save(payment);
        }
    }

    private void insertDeliveryForOrder(Order order) {
        Delivery delivery = Delivery.builder()
                .order(order)
                .status(Delivery.DeliveryStatus.PENDING)
                .destLat(order.getAddress() != null ? order.getAddress().getLat() : null)
                .destLng(order.getAddress() != null ? order.getAddress().getLng() : null)
                .build();
        delivery = deliveryRepository.save(delivery);
        order.setDelivery(delivery);
        orderRepository.save(order);
    }

    @Override
    @Transactional
    public Order updateOrderStatus(Long id, Order.OrderStatus status, User currentUser) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        
        Order.OrderStatus oldStatus = order.getStatus();

        // RBAC: Cho phép MERCHANT, STAFF hoặc ADMIN thao tác các trạng thái vận hành bếp/giao hàng
        boolean isAdmin = hasSystemRole(currentUser, Role.ROLE_ADMIN);
        boolean isMerchant = hasSystemRole(currentUser, Role.ROLE_MERCHANT);
        boolean isStaff = hasSystemRole(currentUser, Role.ROLE_STAFF);
        boolean isOwner = currentUser != null && order.getCustomer() != null && order.getCustomer().getId().equals(currentUser.getId());

        switch (status) {
            case CONFIRMED:
            case PREPARING:
            case READY_FOR_DELIVERY:
            case ASSIGNED:
            case OUT_FOR_DELIVERY:
            case DELIVERED:
            case REJECTED:
                if (!(isAdmin || isMerchant || isStaff)) {
                    throw new IllegalStateException("Chỉ nhân viên cửa hàng hoặc admin mới được cập nhật trạng thái này");
                }
                break;
            case CANCELLED:
                // Cho phép chủ đơn hủy, hoặc admin/merchant
                if (!(isOwner || isAdmin || isMerchant)) {
                    throw new IllegalStateException("Bạn không có quyền hủy đơn này");
                }
                break;
            default:
                break;
        }

        // Ràng buộc thanh toán: từ CONFIRMED trở đi phải PAID
        if ((status == Order.OrderStatus.CONFIRMED ||
             status == Order.OrderStatus.PREPARING ||
             status == Order.OrderStatus.READY_FOR_DELIVERY ||
             status == Order.OrderStatus.ASSIGNED ||
             status == Order.OrderStatus.OUT_FOR_DELIVERY ||
             status == Order.OrderStatus.DELIVERED)
            && order.getPaymentStatus() != Order.PaymentStatus.PAID) {
            throw new IllegalStateException("Đơn chưa thanh toán (PAID), không thể chuyển trạng thái");
        }
        
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

        // Tạo Delivery khi đơn chuyển sang READY_FOR_DELIVERY (nếu chưa có)
        if (status == Order.OrderStatus.READY_FOR_DELIVERY && order.getDelivery() == null) {
            insertDeliveryForOrder(order);
        }
        
        // Gửi WebSocket notification cho realtime order tracking
        webSocketService.sendOrderStatusUpdate(order.getId(), order.getStatus().name());
        
        return order;
    }

    @Override
    @Transactional
    public void cancelOrder(Long id, String reason, User currentUser) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        
        // Check if user has access to this order
        if (currentUser == null || order.getCustomer() == null || !order.getCustomer().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Access denied: Order does not belong to current user");
        }
        
        // Check if order can be cancelled: only before READY_FOR_DELIVERY
        if (!(order.getStatus() == Order.OrderStatus.CREATED ||
              order.getStatus() == Order.OrderStatus.CONFIRMED ||
              order.getStatus() == Order.OrderStatus.PREPARING)) {
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
        
        // Gửi WebSocket notification cho realtime order tracking
        webSocketService.sendOrderStatusUpdate(order.getId(), order.getStatus().name());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Order getOrderById(Long id, User currentUser) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        
        // Allow owner or system roles to view order
        boolean isOwner = currentUser != null && order.getCustomer() != null && order.getCustomer().getId().equals(currentUser.getId());
        boolean hasAdmin = hasSystemRole(currentUser, "ADMIN") || hasSystemRole(currentUser, "ROLE_ADMIN");
        boolean hasMerchant = hasSystemRole(currentUser, "MERCHANT") || hasSystemRole(currentUser, "ROLE_MERCHANT");
        boolean hasStaff = hasSystemRole(currentUser, "STAFF") || hasSystemRole(currentUser, "ROLE_STAFF");
        boolean hasManager = hasSystemRole(currentUser, "MANAGER") || hasSystemRole(currentUser, "ROLE_MANAGER");
        
        if (!(isOwner || hasAdmin || hasMerchant || hasStaff || hasManager)) {
            throw new AccessDeniedException("Access denied: not permitted to view this order");
        }

        // Initialize lazy collections for serialization
        if (order.getOrderItems() != null) {
            order.getOrderItems().size();
        }
        return order;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Order> listMyOrders(User currentUser) {
        List<Order> orders = orderRepository.findByCustomerOrderByCreatedAtDesc(currentUser);
        // Initialize lazy collections to avoid LazyInitializationException during JSON serialization
        for (Order order : orders) {
            if (order.getOrderItems() != null) {
                order.getOrderItems().size();
            }
        }
        return orders;
    }

    @Override
    public Page<OrderResponse> getOrdersByStatus(Order.OrderStatus status, Pageable pageable) {
        Page<Order> orders = orderRepository.findByStatus(status, pageable);
        return orders.map(this::mapOrderToResponse);
    }

    @Override
    public Page<OrderResponse> getOrdersByStatusForUser(Order.OrderStatus status, User currentUser, Pageable pageable) {
        // Check if user is ADMIN - they can see all orders
        boolean isAdmin = hasSystemRole(currentUser, Role.ROLE_ADMIN);
        if (isAdmin) {
            return getOrdersByStatus(status, pageable);
        }

        // For MERCHANT/STAFF, get their assigned stores
        List<StoreStaff> activeStaff = storeStaffRepository.findByUserIdAndStatus(currentUser.getId(), StoreStaff.StaffStatus.ACTIVE);
        List<Store> managerStores = storeRepository.findByManager(currentUser);

        // If user is not staff/manager of any store, return empty result
        if (activeStaff.isEmpty() && managerStores.isEmpty()) {
            return Page.empty(pageable);
        }

        // Collect all stores user has access to
        List<Store> userStores = new java.util.ArrayList<>();
        userStores.addAll(managerStores);
        userStores.addAll(activeStaff.stream().map(StoreStaff::getStore).collect(Collectors.toList()));

        // Remove duplicates
        userStores = userStores.stream().distinct().collect(Collectors.toList());

        // If user has access to multiple stores, we need to combine results
        // For simplicity, let's filter by the first store for now
        // In a real implementation, you might want to add a method to OrderRepository
        // that can filter by multiple stores: findByStatusAndStoreIn(status, stores, pageable)
        if (!userStores.isEmpty()) {
            Store firstStore = userStores.get(0);
            Page<Order> orders = orderRepository.findByStoreAndStatus(firstStore, status, pageable);
            return orders.map(this::mapOrderToResponse);
        }

        return Page.empty(pageable);
    }

    // Helper methods
    
    private void validateStatusTransition(Order.OrderStatus currentStatus, Order.OrderStatus newStatus) {

        switch (currentStatus) {
            case CREATED:
                if (newStatus != Order.OrderStatus.CONFIRMED &&
                    newStatus != Order.OrderStatus.REJECTED &&
                    newStatus != Order.OrderStatus.CANCELLED) {
                    throw new IllegalStateException("Invalid status transition");
                }
                break;
            case CONFIRMED:
                if (newStatus != Order.OrderStatus.PREPARING &&
                    newStatus != Order.OrderStatus.REJECTED &&
                    newStatus != Order.OrderStatus.CANCELLED) {
                    throw new IllegalStateException("Invalid status transition");
                }
                break;
            case PREPARING:
                if (newStatus != Order.OrderStatus.READY_FOR_DELIVERY &&
                    newStatus != Order.OrderStatus.REJECTED &&
                    newStatus != Order.OrderStatus.CANCELLED) {
                    throw new IllegalStateException("Invalid status transition");
                }
                break;
            case READY_FOR_DELIVERY:
                if (newStatus != Order.OrderStatus.ASSIGNED && newStatus != Order.OrderStatus.OUT_FOR_DELIVERY) {
                    throw new IllegalStateException("Invalid status transition");
                }
                break;
            case ASSIGNED:
                if (newStatus != Order.OrderStatus.OUT_FOR_DELIVERY) {
                    throw new IllegalStateException("Invalid status transition");
                }
                break;
            case OUT_FOR_DELIVERY:
                if (newStatus != Order.OrderStatus.DELIVERED && newStatus != Order.OrderStatus.FAILED) {
                    throw new IllegalStateException("Invalid status transition");
                }
                break;
            case DELIVERED:
            case REJECTED:
            case CANCELLED:
            case FAILED:
                throw new IllegalStateException("Cannot change status of a terminal state");
            default:
                throw new IllegalStateException("Unknown order status");
        }
    }

    private boolean hasSystemRole(User user, String code) {
        if (user == null || user.getRoles() == null) return false;
        return user.getRoles().stream().anyMatch(r -> code.equals(r.getCode()));
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