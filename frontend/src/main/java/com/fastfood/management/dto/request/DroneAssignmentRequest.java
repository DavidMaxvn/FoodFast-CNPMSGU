package com.fastfood.management.dto.request;

import lombok.Data;

@Data
public class DroneAssignmentRequest {
    private Long orderId;
    private Long droneId;
}