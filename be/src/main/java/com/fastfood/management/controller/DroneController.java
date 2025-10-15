package com.fastfood.management.controller;

import com.fastfood.management.entity.Drone;
import com.fastfood.management.repository.DroneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/drones")
@RequiredArgsConstructor
public class DroneController {

    private final DroneRepository droneRepository;

    @GetMapping
    public ResponseEntity<List<Drone>> listDrones(@RequestParam(value = "status", required = false) Drone.DroneStatus status) {
        if (status != null) {
            return ResponseEntity.ok(droneRepository.findByStatus(status));
        }
        return ResponseEntity.ok(droneRepository.findAll());
    }

    @GetMapping("/available")
    public ResponseEntity<List<Drone>> listAvailable() {
        return ResponseEntity.ok(droneRepository.findByStatus(Drone.DroneStatus.IDLE));
    }
}