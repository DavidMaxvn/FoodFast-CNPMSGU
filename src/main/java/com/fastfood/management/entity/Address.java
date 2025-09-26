package com.fastfood.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "addresses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Address {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(name = "receiver_name", nullable = false)
    private String receiverName;
    
    @Column(nullable = false)
    private String phone;
    
    @Column(nullable = false)
    private String line1;
    
    private String ward;
    
    private String district;
    
    @Column(nullable = false)
    private String city;
    
    private Double lat;
    
    private Double lng;
    
    @Column(name = "is_default")
    private boolean isDefault = false;
}