package com.fastfood.management.mapper;

import com.fastfood.management.dto.request.OrderRequest;
import com.fastfood.management.dto.response.OrderResponse;
import com.fastfood.management.entity.Order;
import com.fastfood.management.entity.OrderItem;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", uses = {AddressMapper.class})
public interface OrderMapper {

    @Mapping(target = "status", expression = "java(order.getStatus().name())")
    @Mapping(target = "paymentMethod", expression = "java(order.getPaymentMethod().name())")
    @Mapping(target = "paymentStatus", expression = "java(order.getPaymentStatus().name())")
    @Mapping(target = "items", source = "orderItems")
    OrderResponse orderToOrderResponse(Order order);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "menuItemId", source = "menuItem.id")
    @Mapping(target = "menuItemName", source = "menuItem.name")
    OrderResponse.OrderItemResponse orderItemToOrderItemResponse(OrderItem orderItem);

    List<OrderResponse> ordersToOrderResponses(List<Order> orders);
}