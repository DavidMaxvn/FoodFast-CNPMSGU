package com.fastfood.management.controller;

import com.fastfood.management.entity.Category;
import com.fastfood.management.entity.MenuItem;
import com.fastfood.management.entity.Store;
import com.fastfood.management.repository.CategoryRepository;
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
import java.util.Optional;

@RestController
@RequestMapping("/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;

    // 
    // list món ăn.  page/size để phân trang.
    @GetMapping("/items")
    public ResponseEntity<List<MenuItem>> getAvailableItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<MenuItem> result = menuItemRepository.findByAvailableTrue(PageRequest.of(page, size));
        return ResponseEntity.ok(result.getContent());
    }

    // 
    // Truyền vào categoryId để lấy món thuộc danh mục 
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<?> getItemsByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Category category = categoryRepository.findById(categoryId).orElse(null);
        if (category == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không tìm thấy danh mục"));
        }
        Page<MenuItem> result = menuItemRepository.findByCategory(category, PageRequest.of(page, size));
        return ResponseEntity.ok(result.getContent());
    }

    // 
    // filter  search để tìm món có tên chứa từ khoá
    @GetMapping("/search")
    public ResponseEntity<List<MenuItem>> searchByName(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<MenuItem> result = menuItemRepository.findByNameContainingAndAvailableTrue(name, PageRequest.of(page, size));
        return ResponseEntity.ok(result.getContent());
    }

    // 
    // Admin endpoint để lấy tất cả menu items (bao gồm cả unavailable)
    @GetMapping("/all")
    public ResponseEntity<List<MenuItem>> getAllItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<MenuItem> result = menuItemRepository.findAll(PageRequest.of(page, size));
        return ResponseEntity.ok(result.getContent());
    }

    // 
    // Tạo menu item mới
    @PostMapping("/items")
    public ResponseEntity<?> createMenuItem(@RequestBody MenuItem menuItem) {
        try {
            MenuItem savedItem = menuItemRepository.save(menuItem);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedItem);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không thể tạo menu item: " + e.getMessage()));
        }
    }

    // 
    // Cập nhật menu item
    @PutMapping("/items/{id}")
    public ResponseEntity<?> updateMenuItem(@PathVariable Long id, @RequestBody MenuItem menuItem) {
        Optional<MenuItem> existingItem = menuItemRepository.findById(id);
        if (existingItem.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy menu item"));
        }

        try {
            MenuItem item = existingItem.get();
            item.setName(menuItem.getName());
            item.setDescription(menuItem.getDescription());
            item.setPrice(menuItem.getPrice());
            item.setImageUrl(menuItem.getImageUrl());
            item.setAvailable(menuItem.isAvailable());
            item.setCategory(menuItem.getCategory());
            item.setStore(menuItem.getStore());
            
            MenuItem updatedItem = menuItemRepository.save(item);
            return ResponseEntity.ok(updatedItem);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không thể cập nhật menu item: " + e.getMessage()));
        }
    }

    // 
    // Xóa menu item
    @DeleteMapping("/items/{id}")
    public ResponseEntity<?> deleteMenuItem(@PathVariable Long id) {
        Optional<MenuItem> existingItem = menuItemRepository.findById(id);
        if (existingItem.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy menu item"));
        }

        try {
            menuItemRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa menu item thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không thể xóa menu item: " + e.getMessage()));
        }
    }

    // API để lấy danh sách categories
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return ResponseEntity.ok(categories);
    }

    // API để lấy danh sách stores
    @GetMapping("/stores")
    public ResponseEntity<List<Store>> getAllStores() {
        List<Store> stores = storeRepository.findAll();
        return ResponseEntity.ok(stores);
    }
}