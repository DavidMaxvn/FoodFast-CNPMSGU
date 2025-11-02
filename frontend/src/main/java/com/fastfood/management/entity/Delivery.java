package com.fastfood.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "deliveries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Delivery {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "order_id", unique = true)
    private Order order;
    

    @ManyToOne
    @JoinColumn(name = "drone_id")
    private Drone drone;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryStatus status;
    
    // Waypoints for POC simulation
    @Column(name = "w0_lat") // Current drone position
    private Double w0Lat;
    
    @Column(name = "w0_lng")
    private Double w0Lng;
    
    @Column(name = "w1_lat") // Store position (pickup)
    private Double w1Lat;
    
    @Column(name = "w1_lng")
    private Double w1Lng;
    
    @Column(name = "w2_lat") // Customer position (dropoff)
    private Double w2Lat;
    
    @Column(name = "w2_lng")
    private Double w2Lng;
    
    @Column(name = "w3_lat") // Base station (optional return)
    private Double w3Lat;
    
    @Column(name = "w3_lng")
    private Double w3Lng;
    
    // Current simulation state
    @Column(name = "current_segment")
    private String currentSegment; // W0_W1, W1_W2, W2_W3
    
    @Column(name = "segment_start_time")
    private LocalDateTime segmentStartTime;
    
    @Column(name = "eta_seconds")
    private Integer etaSeconds;
    
    @Column(name = "dwell_ticks_remaining")
    private Integer dwellTicksRemaining;
    
    @Column(name = "start_lat")
    private Double startLat;
    
    @Column(name = "start_lng")
    private Double startLng;
    
    @Column(name = "dest_lat")
    private Double destLat;
    
    @Column(name = "dest_lng")
    private Double destLng;
    
    @OneToMany(mappedBy = "delivery", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DeliveryEvent> events = new ArrayList<>();
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum DeliveryStatus {
        PENDING,     // Chờ gán drone
        ASSIGNED,    // Đã gán drone
        IN_PROGRESS, // Drone đang thực hiện delivery
        COMPLETED,   // Hoàn thành giao hàng
        FAILED       // Thất bại
    }
}