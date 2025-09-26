package com.fastfood.management.service.api;

import com.fastfood.management.dto.request.GpsUpdateRequest;
import com.fastfood.management.dto.response.DeliveryResponse;
import com.fastfood.management.dto.response.TrackingResponse;

import java.util.List;

public interface DeliveryService {
    DeliveryResponse createForOrder(Long orderId);
    DeliveryResponse acceptDelivery(Long deliveryId, Long droneUserId);
    DeliveryResponse updateGpsPosition(Long deliveryId, GpsUpdateRequest gpsRequest);
    DeliveryResponse completeDelivery(Long deliveryId);
    TrackingResponse trackDelivery(Long orderId);
    List<DeliveryResponse> getDeliveriesForDrone(Long droneUserId);
    List<DeliveryResponse> getReadyForDelivery();
}