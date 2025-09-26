package com.fastfood.management.controller;

import com.fastfood.management.dto.request.GpsUpdateRequest;
import com.fastfood.management.dto.response.DeliveryResponse;
import com.fastfood.management.dto.response.TrackingResponse;
import com.fastfood.management.service.api.DeliveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;

    @GetMapping
    @PreAuthorize("hasRole('DRONE')")
    public ResponseEntity<List<DeliveryResponse>> getReadyForDelivery() {
        List<DeliveryResponse> deliveries = deliveryService.getReadyForDelivery();
        return ResponseEntity.ok(deliveries);
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('DRONE')")
    public ResponseEntity<DeliveryResponse> acceptDelivery(
            @PathVariable Long id,
            @AuthenticationPrincipal Long droneUserId) {
        DeliveryResponse delivery = deliveryService.acceptDelivery(id, droneUserId);
        return ResponseEntity.ok(delivery);
    }

    @PostMapping("/{id}/gps")
    @PreAuthorize("hasRole('DRONE')")
    public ResponseEntity<DeliveryResponse> updateGpsPosition(
            @PathVariable Long id,
            @Valid @RequestBody GpsUpdateRequest gpsRequest) {
        DeliveryResponse delivery = deliveryService.updateGpsPosition(id, gpsRequest);
        return ResponseEntity.ok(delivery);
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('DRONE')")
    public ResponseEntity<DeliveryResponse> completeDelivery(@PathVariable Long id) {
        DeliveryResponse delivery = deliveryService.completeDelivery(id);
        return ResponseEntity.ok(delivery);
    }

    @GetMapping("/{orderId}/track")
    public ResponseEntity<TrackingResponse> trackDelivery(@PathVariable Long orderId) {
        TrackingResponse tracking = deliveryService.trackDelivery(orderId);
        return ResponseEntity.ok(tracking);
    }
}