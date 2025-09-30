package com.fastfood.management.controller;

import com.fastfood.management.entity.Category;
import com.fastfood.management.entity.MenuItem;
import com.fastfood.management.repository.CategoryRepository;
import com.fastfood.management.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;

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
}