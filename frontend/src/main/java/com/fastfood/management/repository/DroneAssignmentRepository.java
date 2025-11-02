package com.fastfood.management.repository;

import com.fastfood.management.entity.DroneAssignment;
import com.fastfood.management.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DroneAssignmentRepository extends JpaRepository<DroneAssignment, Long> {
    
    Optional<DroneAssignment> findByOrder(Order order);
    
    @Query("SELECT da FROM DroneAssignment da WHERE da.order.id = :orderId")
    Optional<DroneAssignment> findByOrderId(Long orderId);
    
    @Query("SELECT da FROM DroneAssignment da WHERE da.drone.id = :droneId AND da.completedAt IS NULL")
    Optional<DroneAssignment> findActiveAssignmentByDroneId(Long droneId);
}