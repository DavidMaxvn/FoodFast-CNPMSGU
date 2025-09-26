package com.fastfood.management.mapper;

import com.fastfood.management.dto.response.DeliveryResponse;
import com.fastfood.management.dto.response.TrackingResponse;
import com.fastfood.management.entity.Delivery;
import com.fastfood.management.entity.DeliveryEvent;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface DeliveryMapper {

    @Mapping(target = "orderId", source = "order.id")
    @Mapping(target = "status", expression = "java(delivery.getStatus().name())")
    @Mapping(target = "currentPosition", expression = "java(mapLatestPosition(delivery))")
    DeliveryResponse deliveryToDeliveryResponse(Delivery delivery);

    List<DeliveryResponse> deliveriesToDeliveryResponses(List<Delivery> deliveries);

    @Mapping(target = "orderId", source = "order.id")
    @Mapping(target = "orderStatus", source = "order.status.name()")
    @Mapping(target = "deliveryStatus", source = "status.name()")
    @Mapping(target = "currentLat", source = "currentPosition.lat")
    @Mapping(target = "currentLng", source = "currentPosition.lng")
    @Mapping(target = "destinationLat", source = "destLat")
    @Mapping(target = "destinationLng", source = "destLng")
    @Mapping(target = "speedKmh", source = "currentPosition.speedKmh")
    @Mapping(target = "batteryPct", source = "currentPosition.batteryPct")
    @Mapping(target = "history", expression = "java(mapGpsHistory(delivery))")
    TrackingResponse deliveryToTrackingResponse(Delivery delivery);

    default DeliveryResponse.GpsPositionResponse mapLatestPosition(Delivery delivery) {
        if (delivery.getEvents() == null || delivery.getEvents().isEmpty()) {
            return null;
        }
        
        DeliveryEvent latestEvent = delivery.getEvents().stream()
                .filter(e -> e.getEventType() == DeliveryEvent.EventType.GPS_UPDATE)
                .sorted((e1, e2) -> e2.getCreatedAt().compareTo(e1.getCreatedAt()))
                .findFirst()
                .orElse(null);
                
        if (latestEvent == null) {
            return null;
        }
        
        DeliveryResponse.GpsPositionResponse position = new DeliveryResponse.GpsPositionResponse();
        position.setLat(latestEvent.getLat());
        position.setLng(latestEvent.getLng());
        position.setAltitude(latestEvent.getAltitude());
        position.setSpeedKmh(latestEvent.getSpeedKmh());
        position.setHeading(latestEvent.getHeading());
        position.setBatteryPct(latestEvent.getBatteryPct());
        position.setTimestamp(latestEvent.getCreatedAt());
        
        return position;
    }
    
    default List<TrackingResponse.GpsHistoryPoint> mapGpsHistory(Delivery delivery) {
        if (delivery.getEvents() == null || delivery.getEvents().isEmpty()) {
            return List.of();
        }
        
        return delivery.getEvents().stream()
                .filter(e -> e.getEventType() == DeliveryEvent.EventType.GPS_UPDATE)
                .sorted((e1, e2) -> e1.getCreatedAt().compareTo(e2.getCreatedAt()))
                .map(e -> {
                    TrackingResponse.GpsHistoryPoint point = new TrackingResponse.GpsHistoryPoint();
                    point.setLat(e.getLat());
                    point.setLng(e.getLng());
                    point.setTimestamp(e.getCreatedAt());
                    return point;
                })
                .toList();
    }
}