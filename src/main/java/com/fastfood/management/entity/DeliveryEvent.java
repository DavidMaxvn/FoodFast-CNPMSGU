package com.fastfood.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryEvent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "delivery_id")
    private Delivery delivery;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;
    
    private Double lat;
    
    private Double lng;
    
    @Column(name = "speed_kmh")
    private Double speedKmh;
    
    private Double heading;
    
    @Column(name = "battery_pct")
    private Double batteryPct;
    
    @Column(nullable = false)
    private LocalDateTime ts;
    
    public enum EventType {
        GPS_UPDATE, STATUS_CHANGE, DELIVERY_START, DELIVERY_COMPLETE
    }
}