package com.fastfood.management.repository;

import com.fastfood.management.entity.Drone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DroneRepository extends JpaRepository<Drone, Long> {
    java.util.List<Drone> findByStatus(Drone.DroneStatus status);
    long countByStatus(Drone.DroneStatus status);
    java.util.List<Drone> findByStatusIn(java.util.List<Drone.DroneStatus> statuses);
}