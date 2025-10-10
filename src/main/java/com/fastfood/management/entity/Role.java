package com.fastfood.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "roles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String code;
    
    public static final String ROLE_CUSTOMER = "CUSTOMER";
    public static final String ROLE_KITCHEN = "KITCHEN";
    public static final String ROLE_SERVICE = "SERVICE";
    public static final String ROLE_DRONE = "DRONE";
    public static final String ROLE_ADMIN = "ADMIN";
}