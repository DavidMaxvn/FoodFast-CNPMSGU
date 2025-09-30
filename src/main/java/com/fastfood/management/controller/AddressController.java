package com.fastfood.management.controller;

import com.fastfood.management.dto.request.AddressRequest;
import com.fastfood.management.entity.Address;
import com.fastfood.management.entity.User;
import com.fastfood.management.repository.AddressRepository;
import com.fastfood.management.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<?> createAddress(@Valid @RequestBody AddressRequest req,
                                           @RequestParam("userId") Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không tìm thấy người dùng"));
        }

        // Build entity from request
        Address address = Address.builder()
                .user(user)
                .receiverName(req.getReceiverName())
                .phone(req.getPhone())
                .line1(req.getLine1())
                .ward(req.getWard())
                .district(req.getDistrict())
                .city(req.getCity())
                .lat(req.getLat())
                .lng(req.getLng())
                .build();

        // Set default logic: first address OR explicitly requested isDefault
        List<Address> existing = addressRepository.findByUser(user);
        boolean makeDefault = existing.isEmpty() || req.isDefault();
        if (makeDefault) {
            // remove default from others
            addressRepository.findByUserAndIsDefaultTrue(user).ifPresent(cur -> {
                cur.setDefault(false);
                addressRepository.save(cur);
            });
            address.setDefault(true);
        }

        Address saved = addressRepository.save(address);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public ResponseEntity<?> listMyAddresses(@RequestParam("userId") Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không tìm thấy người dùng"));
        }
        List<Address> list = addressRepository.findByUserOrderByIsDefaultDesc(user);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/default")
    public ResponseEntity<?> getDefaultAddress(@RequestParam("userId") Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không tìm thấy người dùng"));
        }
        return addressRepository.findByUserAndIsDefaultTrue(user)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không có địa chỉ mặc định")));
    }

    @PutMapping("/{id}/default")
    @Transactional
    public ResponseEntity<?> setDefault(@PathVariable("id") Long id,
                                        @RequestParam("userId") Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không tìm thấy người dùng"));
        }
        Address target = addressRepository.findById(id).orElse(null);
        if (target == null || target.getUser() == null || !target.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy địa chỉ thuộc người dùng"));
        }

        // Remove current default
        addressRepository.findByUserAndIsDefaultTrue(user).ifPresent(cur -> {
            if (!cur.getId().equals(target.getId())) {
                cur.setDefault(false);
                addressRepository.save(cur);
            }
        });
        // Set new default
        target.setDefault(true);
        Address saved = addressRepository.save(target);
        return ResponseEntity.ok(saved);
    }
}