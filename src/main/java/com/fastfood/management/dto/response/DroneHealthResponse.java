package com.fastfood.management.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DroneHealthResponse {
    private Long droneId;
    private String serial;
    private String model;
    private String status;
    private Double batteryPct;
    private Double currentLat;
    private Double currentLng;
    private LocalDateTime lastSeenAt;
    
    // Health indicators
    private Boolean isHealthy;
    private Boolean isBatteryLow;
    private Boolean isOffline;
    private Boolean needsMaintenance;
    
    // Health score (0-100)
    private Integer healthScore;
    
    // Issues and warnings
    private String[] warnings;
    private String maintenanceReason;
    
    // Operational metrics
    private Integer totalFlights;
    private Double totalDistance;
    private LocalDateTime lastMaintenanceAt;
}