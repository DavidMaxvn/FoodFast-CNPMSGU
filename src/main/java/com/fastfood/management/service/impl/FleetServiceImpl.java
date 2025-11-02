package com.fastfood.management.service.impl;

import com.fastfood.management.entity.*;
import com.fastfood.management.repository.DeliveryRepository;
import com.fastfood.management.repository.DroneAssignmentRepository;
import com.fastfood.management.repository.DroneRepository;
import com.fastfood.management.service.api.FleetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FleetServiceImpl implements FleetService {
    
    private final DroneRepository droneRepository;
    private final DroneAssignmentRepository assignmentRepository;
    private final DeliveryRepository deliveryRepository;
    
    @Override
    @Transactional
    public Optional<DroneAssignment> autoAssignDrone(Order order) {
        log.info("Auto-assigning drone for order: {}", order.getId());
        
        List<Drone> availableDrones = getAvailableDrones();
        if (availableDrones.isEmpty()) {
            log.warn("No available drones for order: {}", order.getId());
            return Optional.empty();
        }
        
        Optional<Drone> selectedDrone = selectDroneRoundRobin(availableDrones);
        if (selectedDrone.isEmpty()) {
            return Optional.empty();
        }
        
        return Optional.of(createAssignment(order, selectedDrone.get(), "SYSTEM", DroneAssignment.AssignmentMode.AUTO));
    }
    
    @Override
    @Transactional
    public DroneAssignment manualAssignDrone(Order order, Drone drone, String assignedBy) {
        log.info("Manual assignment: Order {} to Drone {} by {}", order.getId(), drone.getId(), assignedBy);
        
        if (drone.getStatus() != Drone.DroneStatus.IDLE) {
            throw new IllegalStateException("Drone " + drone.getId() + " is not available for assignment");
        }
        
        return createAssignment(order, drone, assignedBy, DroneAssignment.AssignmentMode.MANUAL);
    }
    
    private DroneAssignment createAssignment(Order order, Drone drone, String assignedBy, DroneAssignment.AssignmentMode mode) {
        // Validate required order data to avoid NPEs and invalid assignments
        if (order == null) {
            throw new IllegalStateException("Order is required for assignment");
        }
        if (order.getStore() == null) {
            throw new IllegalStateException("Order store is missing; cannot compute pickup coordinates");
        }
        if (order.getAddress() == null) {
            throw new IllegalStateException("Order address is missing; cannot compute destination coordinates");
        }
        if (order.getStore().getLatitude() == null || order.getStore().getLongitude() == null) {
            throw new IllegalStateException("Store coordinates are missing (lat/lng); please set store lat/lng");
        }
        if (order.getAddress().getLatitude() == null || order.getAddress().getLongitude() == null) {
            throw new IllegalStateException("Customer address coordinates are missing (lat/lng); please set address lat/lng");
        }
        if (drone == null) {
            throw new IllegalStateException("Drone is required for assignment");
        }

        // Cập nhật trạng thái drone
        drone.setStatus(Drone.DroneStatus.ASSIGNED);
        drone.setLastAssignedAt(LocalDateTime.now());
        droneRepository.save(drone);
        
        // Cập nhật trạng thái order
        order.setStatus(Order.OrderStatus.ASSIGNED);
        
        // Tạo hoặc tái sử dụng delivery record để tránh vi phạm unique constraint (order_id)
        Delivery delivery = order.getDelivery();
        if (delivery == null) {
            delivery = Delivery.builder()
                    .order(order)
                    .build();
        }

        delivery.setDrone(drone);
        delivery.setStatus(Delivery.DeliveryStatus.ASSIGNED);
        delivery.setW0Lat(drone.getCurrentLat());
        delivery.setW0Lng(drone.getCurrentLng());
        delivery.setW1Lat(order.getStore().getLatitude());
        delivery.setW1Lng(order.getStore().getLongitude());
        delivery.setW2Lat(order.getAddress().getLatitude());
        delivery.setW2Lng(order.getAddress().getLongitude());
        delivery.setW3Lat(drone.getHomeLat());
        delivery.setW3Lng(drone.getHomeLng());
        delivery.setCurrentSegment("W0_W1");
        delivery.setSegmentStartTime(LocalDateTime.now());
        delivery.setEtaSeconds(calculateInitialETA());

        delivery = deliveryRepository.save(delivery);
        order.setDelivery(delivery);

        // Tạo assignment record
        DroneAssignment assignment = DroneAssignment.builder()
                .order(order)
                .drone(drone)
                .delivery(delivery)
                .assignmentMode(mode)
                .assignedBy(assignedBy)
                .assignedAt(LocalDateTime.now())
                .build();
        
        return assignmentRepository.save(assignment);
    }
    
    @Override
    public List<Drone> getAvailableDrones() {
        return droneRepository.findByStatus(Drone.DroneStatus.IDLE);
    }
    
    @Override
    public Optional<Drone> selectDroneRoundRobin(List<Drone> availableDrones) {
        if (availableDrones.isEmpty()) {
            return Optional.empty();
        }
        
        // Chọn drone có lastAssignedAt cũ nhất (hoặc null)
        return availableDrones.stream()
                .min(Comparator.comparing(drone -> 
                    drone.getLastAssignedAt() != null ? drone.getLastAssignedAt() : LocalDateTime.MIN));
    }
    
    @Override
    @Transactional
    public void completeAssignment(Long assignmentId) {
        DroneAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));
        
        // Cập nhật assignment
        assignment.setCompletedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);
        
        // Đặt drone về IDLE
        Drone drone = assignment.getDrone();
        drone.setStatus(Drone.DroneStatus.IDLE);
        droneRepository.save(drone);
        
        log.info("Completed assignment {} - Drone {} is now IDLE", assignmentId, drone.getId());
    }
    
    @Override
    public Optional<DroneAssignment> getCurrentAssignment(Long droneId) {
        return assignmentRepository.findActiveAssignmentByDroneId(droneId);
    }
    
    private Integer calculateInitialETA() {
        // POC: Tổng thời gian các leg theo config
        // W0→W1: 90s, W1→W2: 240s, W2→W3: 120s + dwell: 10s
        return 90 + 240 + 10; // Không tính W2→W3 trong ETA giao hàng
    }
}