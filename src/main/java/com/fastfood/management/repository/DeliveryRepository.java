package com.fastfood.management.repository;

import com.fastfood.management.entity.Delivery;
import com.fastfood.management.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    Optional<Delivery> findByOrder(Order order);
    List<Delivery> findByStatus(Delivery.DeliveryStatus status);
    List<Delivery> findByDroneUserIdAndStatus(Long droneUserId, Delivery.DeliveryStatus status);
}