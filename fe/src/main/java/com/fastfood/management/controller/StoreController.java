package com.fastfood.management.controller;

import com.fastfood.management.entity.MenuItem;
import com.fastfood.management.entity.Store;
import com.fastfood.management.repository.MenuItemRepository;
import com.fastfood.management.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreRepository storeRepository;
    private final MenuItemRepository menuItemRepository;

    @GetMapping
    public ResponseEntity<List<Store>> listStores(@RequestParam(name = "open", required = false) Boolean open) {
        if (Boolean.TRUE.equals(open)) {
            return ResponseEntity.ok(storeRepository.findByStatus(Store.StoreStatus.ACTIVE));
        }
        return ResponseEntity.ok(storeRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getStore(@PathVariable Long id) {
        Store store = storeRepository.findById(id).orElse(null);
        if (store == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy cửa hàng"));
        }
        return ResponseEntity.ok(store);
    }

    @GetMapping("/{id}/menu")
    public ResponseEntity<?> getStoreMenu(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Store store = storeRepository.findById(id).orElse(null);
        if (store == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy cửa hàng"));
        }
        Page<MenuItem> result = menuItemRepository.findByStoreAndAvailableTrue(store, PageRequest.of(page, size));
        return ResponseEntity.ok(result.getContent());
    }
}