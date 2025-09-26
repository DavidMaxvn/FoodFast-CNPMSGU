package com.fastfood.management.service.api;

import com.fastfood.management.entity.Delivery;
import com.fastfood.management.entity.DeliveryEvent;

public interface DroneEtaService {
    
    /**
     * Calculate ETA in minutes based on current drone position and destination
     * @param delivery The delivery containing destination coordinates
     * @param currentLat Current drone latitude
     * @param currentLng Current drone longitude
     * @param speedKmh Current drone speed in km/h
     * @return Estimated time of arrival in minutes
     */
    double calculateEta(Delivery delivery, double currentLat, double currentLng, double speedKmh);
    
    /**
     * Calculate ETA in minutes based on delivery and latest delivery event
     * @param delivery The delivery containing destination coordinates
     * @param latestEvent The latest delivery event with drone position
     * @return Estimated time of arrival in minutes
     */
    double calculateEta(Delivery delivery, DeliveryEvent latestEvent);
    
    /**
     * Calculate distance between two coordinates using Haversine formula
     * @param lat1 First latitude
     * @param lng1 First longitude
     * @param lat2 Second latitude
     * @param lng2 Second longitude
     * @return Distance in kilometers
     */
    double calculateDistance(double lat1, double lng1, double lat2, double lng2);
}