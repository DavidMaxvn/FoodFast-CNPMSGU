package com.fastfood.management.controller;

import com.fastfood.management.entity.MenuItem;
import com.fastfood.management.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu-items")
@RequiredArgsConstructor
public class MenuItemController {

    private final MenuItemRepository menuItemRepository;

    @GetMapping
    public ResponseEntity<List<MenuItem>> getAllMenuItems() {
        List<MenuItem> menuItems = menuItemRepository.findByAvailableTrue();
        return ResponseEntity.ok(menuItems);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuItem> getMenuItemById(@PathVariable Long id) {
        return menuItemRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<MenuItem>> getMenuItemsByCategory(@PathVariable Long categoryId) {
        List<MenuItem> menuItems = menuItemRepository.findByCategoryIdAndAvailableTrue(categoryId);
        return ResponseEntity.ok(menuItems);
    }

    @PutMapping("/{id}/availability")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MenuItem> updateAvailability(
            @PathVariable Long id,
            @RequestParam boolean available) {
        return menuItemRepository.findById(id)
                .map(menuItem -> {
                    menuItem.setAvailable(available);
                    return ResponseEntity.ok(menuItemRepository.save(menuItem));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}