package com.fastfood.management.service.api;

import com.fastfood.management.dto.request.GpsUpdateRequest;
import com.fastfood.management.dto.response.DeliveryResponse;
import com.fastfood.management.dto.response.TrackingResponse;

import java.util.List;

public interface DeliveryService {
    List<DeliveryResponse> getReadyForDelivery();
    DeliveryResponse acceptDelivery(Long deliveryId, Long droneId);
    DeliveryResponse updateGpsPosition(Long deliveryId, GpsUpdateRequest gpsRequest);
    DeliveryResponse completeDelivery(Long deliveryId);
    TrackingResponse trackDelivery(Long orderId);
}