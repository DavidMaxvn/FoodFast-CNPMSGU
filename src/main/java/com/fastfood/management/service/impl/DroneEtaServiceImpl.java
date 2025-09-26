package com.fastfood.management.service.impl;

import com.fastfood.management.entity.Delivery;
import com.fastfood.management.entity.DeliveryEvent;
import com.fastfood.management.service.api.DroneEtaService;
import org.springframework.stereotype.Service;

@Service
public class DroneEtaServiceImpl implements DroneEtaService {

    private static final double DEFAULT_SPEED_KMH = 30.0; // Default drone speed in km/h
    private static final double EARTH_RADIUS_KM = 6371.0; // Earth radius in kilometers

    @Override
    public double calculateEta(Delivery delivery, double currentLat, double currentLng, double speedKmh) {
        double distance = calculateDistance(currentLat, currentLng, delivery.getDestLat(), delivery.getDestLng());
        
        // If speed is zero or negative, use default speed
        double speed = (speedKmh <= 0) ? DEFAULT_SPEED_KMH : speedKmh;
        
        // Calculate ETA in minutes: (distance / speed) * 60
        return (distance / speed) * 60.0;
    }

    @Override
    public double calculateEta(Delivery delivery, DeliveryEvent latestEvent) {
        if (latestEvent == null) {
            // If no event is available, calculate from start position
            return calculateEta(delivery, delivery.getStartLat(), delivery.getStartLng(), DEFAULT_SPEED_KMH);
        }
        
        double speed = (latestEvent.getSpeedKmh() <= 0) ? DEFAULT_SPEED_KMH : latestEvent.getSpeedKmh();
        return calculateEta(delivery, latestEvent.getLat(), latestEvent.getLng(), speed);
    }

    @Override
    public double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        // Convert degrees to radians
        double lat1Rad = Math.toRadians(lat1);
        double lng1Rad = Math.toRadians(lng1);
        double lat2Rad = Math.toRadians(lat2);
        double lng2Rad = Math.toRadians(lng2);
        
        // Haversine formula
        double dLat = lat2Rad - lat1Rad;
        double dLng = lng2Rad - lng1Rad;
        
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        // Distance in kilometers
        return EARTH_RADIUS_KM * c;
    }
}