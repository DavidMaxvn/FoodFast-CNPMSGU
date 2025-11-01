package com.fastfood.management.service.impl;

import com.fastfood.management.config.DroneConfig;
import com.fastfood.management.entity.Delivery;
import com.fastfood.management.entity.DeliveryEvent;
import com.fastfood.management.entity.Drone;
import com.fastfood.management.entity.Order;
import com.fastfood.management.repository.DeliveryEventRepository;
import com.fastfood.management.repository.DeliveryRepository;
import com.fastfood.management.repository.DroneRepository;
import com.fastfood.management.repository.OrderRepository;
import com.fastfood.management.service.api.DroneSimulator;
import com.fastfood.management.service.api.DroneTrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class DroneSimulatorImpl implements DroneSimulator {
    
    private final DroneConfig droneConfig;
    private final DeliveryRepository deliveryRepository;
    private final DroneRepository droneRepository;
    private final OrderRepository orderRepository;
    private final DeliveryEventRepository eventRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final DroneTrackingService droneTrackingService;
    
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10);
    private final Map<Long, ScheduledFuture<?>> activeSimulations = new ConcurrentHashMap<>();
    
    @Override
    @Async
    public void startSimulation(Long deliveryId) {
        log.info("Starting simulation for delivery: {}", deliveryId);
        
        // Dừng simulation cũ nếu có
        stopSimulation(deliveryId);
        
        // Bắt đầu simulation mới với GPS tick interval
        ScheduledFuture<?> future = scheduler.scheduleAtFixedRate(
            () -> {
                try {
                    Delivery delivery = deliveryRepository.findById(deliveryId).orElse(null);
                    if (delivery != null && delivery.getStatus() == Delivery.DeliveryStatus.IN_PROGRESS) {
                        tick(delivery);
                    } else {
                        stopSimulation(deliveryId);
                    }
                } catch (Exception e) {
                    log.error("Error in simulation tick for delivery {}: {}", deliveryId, e.getMessage());
                }
            },
            0, // Initial delay
            droneConfig.getGpsTickSec(), // Period
            TimeUnit.SECONDS
        );
        
        activeSimulations.put(deliveryId, future);
    }
    
    @Override
    public void stopSimulation(Long deliveryId) {
        ScheduledFuture<?> future = activeSimulations.remove(deliveryId);
        if (future != null) {
            future.cancel(false);
            log.info("Stopped simulation for delivery: {}", deliveryId);
        }
    }
    
    @Override
    @Transactional
    public void tick(Delivery delivery) {
        try {
            // Tính toán vị trí hiện tại
            double[] currentPos = calculateCurrentPosition(delivery);
            double currentLat = currentPos[0];
            double currentLng = currentPos[1];
            
            // Tính ETA còn lại
            int remainingETA = calculateRemainingETA(delivery);
            
            // Cập nhật vị trí drone
            Drone drone = delivery.getDrone();
            drone.setCurrentLat(currentLat);
            drone.setCurrentLng(currentLng);
            drone.setLastSeenAt(LocalDateTime.now());
            droneRepository.save(drone);
            
            // Cập nhật ETA trong delivery
            delivery.setEtaSeconds(remainingETA);
            deliveryRepository.save(delivery);
            
            // Tạo GPS event
            DeliveryEvent gpsEvent = DeliveryEvent.builder()
                    .delivery(delivery)
                    .eventType(DeliveryEvent.EventType.GPS_UPDATE)
                    .lat(currentLat)
                    .lng(currentLng)
                    .ts(LocalDateTime.now())
                    .build();
            eventRepository.save(gpsEvent);
            
            // Gửi WebSocket update
            sendGPSUpdate(delivery, currentLat, currentLng, remainingETA);
            
            // Kiểm tra chuyển segment
            if (shouldMoveToNextSegment(delivery)) {
                boolean hasNext = moveToNextSegment(delivery);
                if (!hasNext) {
                    completeDelivery(delivery);
                }
            }
            
        } catch (Exception e) {
            log.error("Error in tick for delivery {}: {}", delivery.getId(), e.getMessage());
        }
    }
    
    @Override
    public double[] calculateCurrentPosition(Delivery delivery) {
        String segment = delivery.getCurrentSegment();
        LocalDateTime segmentStart = delivery.getSegmentStartTime();
        int segmentDuration = droneConfig.getLegDuration(segment);
        
        // Tính elapsed time từ khi bắt đầu segment (seconds)
        long elapsedSeconds = ChronoUnit.SECONDS.between(segmentStart, LocalDateTime.now());
        
        // Tính progress (u) từ 0 đến 1
        double u = Math.min(1.0, (double) elapsedSeconds / segmentDuration);
        
        // Lấy tọa độ start và end của segment
        double[] startPos = getSegmentStartPosition(delivery, segment);
        double[] endPos = getSegmentEndPosition(delivery, segment);
        
        // Linear interpolation
        double currentLat = (1 - u) * startPos[0] + u * endPos[0];
        double currentLng = (1 - u) * startPos[1] + u * endPos[1];
        
        return new double[]{currentLat, currentLng};
    }
    
    @Override
    public int calculateRemainingETA(Delivery delivery) {
        String segment = delivery.getCurrentSegment();
        LocalDateTime segmentStart = delivery.getSegmentStartTime();
        int segmentDuration = droneConfig.getLegDuration(segment);
        
        // Thời gian còn lại của segment hiện tại
        long elapsedSeconds = ChronoUnit.SECONDS.between(segmentStart, LocalDateTime.now());
        int remainingInSegment = Math.max(0, segmentDuration - (int) elapsedSeconds);
        
        // Thời gian của các segment còn lại
        int remainingSegments = 0;
        switch (segment) {
            case "W0_W1":
                remainingSegments = droneConfig.getLegDuration("W1_W2") + droneConfig.getDwellSecCustomer();
                break;
            case "W1_W2":
                remainingSegments = droneConfig.getDwellSecCustomer();
                break;
            case "DWELL":
                remainingSegments = delivery.getDwellTicksRemaining() * droneConfig.getGpsTickSec();
                break;
            default:
                remainingSegments = 0;
        }
        
        return remainingInSegment + remainingSegments;
    }
    
    @Override
    @Transactional
    public boolean moveToNextSegment(Delivery delivery) {
        String currentSegment = delivery.getCurrentSegment();
        String nextSegment = getNextSegment(currentSegment);
        
        if (nextSegment == null) {
            return false; // Đã hoàn thành
        }
        
        // Cập nhật drone status
        Drone drone = delivery.getDrone();
        updateDroneStatusForSegment(drone, nextSegment);
        droneRepository.save(drone);
        
        // Cập nhật delivery
        delivery.setCurrentSegment(nextSegment);
        delivery.setSegmentStartTime(LocalDateTime.now());
        
        if ("DWELL".equals(nextSegment)) {
            delivery.setDwellTicksRemaining(droneConfig.getDwellTicks());
        }
        
        deliveryRepository.save(delivery);
        
        // Gửi state change event
        sendStateChangeEvent(delivery, nextSegment);
        
        log.info("Delivery {} moved to segment: {}", delivery.getId(), nextSegment);
        return true;
    }
    
    private boolean shouldMoveToNextSegment(Delivery delivery) {
        String segment = delivery.getCurrentSegment();
        
        if ("DWELL".equals(segment)) {
            // Kiểm tra dwell ticks
            Integer remaining = delivery.getDwellTicksRemaining();
            if (remaining != null && remaining > 0) {
                delivery.setDwellTicksRemaining(remaining - 1);
                deliveryRepository.save(delivery);
                return remaining <= 1;
            }
            return true;
        }
        
        // Kiểm tra thời gian segment
        LocalDateTime segmentStart = delivery.getSegmentStartTime();
        int segmentDuration = droneConfig.getLegDuration(segment);
        long elapsedSeconds = ChronoUnit.SECONDS.between(segmentStart, LocalDateTime.now());
        
        return elapsedSeconds >= segmentDuration;
    }
    
    private String getNextSegment(String currentSegment) {
        switch (currentSegment) {
            case "W0_W1": return "W1_W2";
            case "W1_W2": return "DWELL";
            case "DWELL": return null; // Hoàn thành
            default: return null;
        }
    }
    
    private void updateDroneStatusForSegment(Drone drone, String segment) {
        switch (segment) {
            case "W0_W1":
                drone.setStatus(Drone.DroneStatus.EN_ROUTE_TO_STORE);
                break;
            case "W1_W2":
                drone.setStatus(Drone.DroneStatus.EN_ROUTE_TO_CUSTOMER);
                break;
            case "DWELL":
                drone.setStatus(Drone.DroneStatus.ARRIVING);
                break;
        }
    }
    
    private double[] getSegmentStartPosition(Delivery delivery, String segment) {
        switch (segment) {
            case "W0_W1": return new double[]{delivery.getW0Lat(), delivery.getW0Lng()};
            case "W1_W2": return new double[]{delivery.getW1Lat(), delivery.getW1Lng()};
            case "DWELL": return new double[]{delivery.getW2Lat(), delivery.getW2Lng()};
            default: return new double[]{0.0, 0.0};
        }
    }
    
    private double[] getSegmentEndPosition(Delivery delivery, String segment) {
        switch (segment) {
            case "W0_W1": return new double[]{delivery.getW1Lat(), delivery.getW1Lng()};
            case "W1_W2": return new double[]{delivery.getW2Lat(), delivery.getW2Lng()};
            case "DWELL": return new double[]{delivery.getW2Lat(), delivery.getW2Lng()};
            default: return new double[]{0.0, 0.0};
        }
    }
    
    private void completeDelivery(Delivery delivery) {
        // Cập nhật trạng thái
        delivery.setStatus(Delivery.DeliveryStatus.COMPLETED);
        deliveryRepository.save(delivery);
        
        // Cập nhật order
        Order order = delivery.getOrder();
        order.setStatus(Order.OrderStatus.DELIVERED);
        orderRepository.save(order);
        
        // Cập nhật drone
        Drone drone = delivery.getDrone();
        drone.setStatus(Drone.DroneStatus.IDLE);
        droneRepository.save(drone);
        
        // Dừng simulation
        stopSimulation(delivery.getId());
        
        // Gửi completion event
        sendStateChangeEvent(delivery, "COMPLETED");
        
        log.info("Delivery {} completed successfully", delivery.getId());
    }
    
    private void sendGPSUpdate(Delivery delivery, double lat, double lng, int eta) {
        // Cập nhật vị trí drone qua tracking service
        droneTrackingService.updateDroneGps(
            delivery.getDrone().getId(), 
            lat, 
            lng, 
            delivery.getDrone().getBatteryPct()
        );
        
        // Cập nhật tiến độ delivery
        droneTrackingService.updateDeliveryProgress(
            delivery.getId(),
            delivery.getCurrentSegment(),
            eta,
            delivery.getStatus().toString()
        );
        
        // Gửi ETA update nếu có thay đổi
        if (delivery.getEtaSeconds() != eta) {
            droneTrackingService.notifyDeliveryEtaUpdate(delivery.getId(), eta);
        }
        
        // Vẫn giữ WebSocket cũ cho backward compatibility
        Map<String, Object> payload = Map.of(
            "eventType", "GPS_UPDATE",
            "deliveryId", delivery.getId(),
            "orderId", delivery.getOrder().getId(),
            "droneId", delivery.getDrone().getId(),
            "lat", lat,
            "lng", lng,
            "segment", delivery.getCurrentSegment(),
            "etaSec", eta,
            "ts", LocalDateTime.now().toString()
        );
        
        messagingTemplate.convertAndSend("/topic/delivery/" + delivery.getOrder().getId(), payload);
    }
    
    private void sendStateChangeEvent(Delivery delivery, String newState) {
        Map<String, Object> payload = Map.of(
            "eventType", "STATE_CHANGE",
            "deliveryId", delivery.getId(),
            "orderId", delivery.getOrder().getId(),
            "droneId", delivery.getDrone().getId(),
            "newState", newState,
            "ts", LocalDateTime.now().toString()
        );
        
        messagingTemplate.convertAndSend("/topic/delivery/" + delivery.getOrder().getId(), payload);
    }
    
    @Override
    public boolean isSimulationRunning(Long deliveryId) {
        ScheduledFuture<?> future = activeSimulations.get(deliveryId);
        return future != null && !future.isDone() && !future.isCancelled();
    }
}