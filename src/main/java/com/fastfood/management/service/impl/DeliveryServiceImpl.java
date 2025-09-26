package com.fastfood.management.service.impl;

import com.fastfood.management.dto.request.DeliveryRequest;
import com.fastfood.management.dto.response.DeliveryResponse;
import com.fastfood.management.dto.response.TrackingResponse;
import com.fastfood.management.entity.Delivery;
import com.fastfood.management.entity.Order;
import com.fastfood.management.exception.ResourceNotFoundException;
import com.fastfood.management.mapper.DeliveryMapper;
import com.fastfood.management.repository.DeliveryRepository;
import com.fastfood.management.repository.OrderRepository;
import com.fastfood.management.service.api.DeliveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DeliveryServiceImpl implements DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final DeliveryMapper deliveryMapper;

    @Override
    public DeliveryResponse createDelivery(DeliveryRequest deliveryRequest) {
        Order order = orderRepository.findById(deliveryRequest.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + deliveryRequest.getOrderId()));

        Delivery delivery = Delivery.builder()
                .order(order)
                .driverName(deliveryRequest.getDriverName())
                .driverPhone(deliveryRequest.getDriverPhone())
                .vehicleType(deliveryRequest.getVehicleType())
                .vehiclePlate(deliveryRequest.getVehiclePlate())
                .status(Delivery.DeliveryStatus.ASSIGNED)
                .destLat(deliveryRequest.getDestLat())
                .destLng(deliveryRequest.getDestLng())
                .estimatedDeliveryTime(deliveryRequest.getEstimatedDeliveryTime())
                .build();

        Delivery savedDelivery = deliveryRepository.save(delivery);
        return deliveryMapper.toResponse(savedDelivery);
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryResponse getDeliveryById(Long id) {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + id));
        return deliveryMapper.toResponse(delivery);
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryResponse getDeliveryByOrderId(Long orderId) {
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found for order id: " + orderId));
        return deliveryMapper.toResponse(delivery);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DeliveryResponse> getAllDeliveries(Pageable pageable) {
        Page<Delivery> deliveries = deliveryRepository.findAll(pageable);
        return deliveries.map(deliveryMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeliveryResponse> getDeliveriesByStatus(Delivery.DeliveryStatus status) {
        List<Delivery> deliveries = deliveryRepository.findByStatus(status);
        return deliveries.stream()
                .map(deliveryMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DeliveryResponse updateDeliveryStatus(Long id, Delivery.DeliveryStatus status) {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + id));

        delivery.setStatus(status);
        
        if (status == Delivery.DeliveryStatus.DELIVERED) {
            delivery.setActualDeliveryTime(LocalDateTime.now());
        }

        Delivery updatedDelivery = deliveryRepository.save(delivery);
        return deliveryMapper.toResponse(updatedDelivery);
    }

    @Override
    @Transactional(readOnly = true)
    public TrackingResponse trackDelivery(Long orderId) {
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found for order id: " + orderId));
        return deliveryMapper.deliveryToTrackingResponse(delivery);
    }

    @Override
    public void assignDriver(Long deliveryId, String driverName, String driverPhone) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + deliveryId));

        delivery.setDriverName(driverName);
        delivery.setDriverPhone(driverPhone);
        delivery.setStatus(Delivery.DeliveryStatus.ASSIGNED);

        deliveryRepository.save(delivery);
    }

    @Override
    public void updateLocation(Long deliveryId, Double lat, Double lng, Double speedKmh, Integer batteryPct) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + deliveryId));

        // In a real implementation, this would create a new DeliveryEvent
        // For now, we'll just update the delivery status if it's not already in transit
        if (delivery.getStatus() == Delivery.DeliveryStatus.ASSIGNED) {
            delivery.setStatus(Delivery.DeliveryStatus.IN_TRANSIT);
            deliveryRepository.save(delivery);
        }
    }
}