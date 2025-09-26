package com.fastfood.management.service.impl;

import com.fastfood.management.entity.Inventory;
import com.fastfood.management.repository.InventoryRepository;
import com.fastfood.management.repository.MenuItemRepository;
import com.fastfood.management.service.api.InventoryService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final MenuItemRepository menuItemRepository;

    @Override
    public Inventory getByMenuItemId(Long menuItemId) {
        return inventoryRepository.findByMenuItemId(menuItemId)
                .orElseThrow(() -> new RuntimeException("Inventory not found for menu item ID: " + menuItemId));
    }

    @Override
    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    @Override
    public List<Inventory> getLowStockItems() {
        return inventoryRepository.findLowStockItems();
    }

    @Override
    public boolean checkStock(Map<Long, Integer> menuItemQuantities) {
        for (Map.Entry<Long, Integer> entry : menuItemQuantities.entrySet()) {
            Optional<Inventory> inventoryOpt = inventoryRepository.findByMenuItemId(entry.getKey());
            if (inventoryOpt.isEmpty() || inventoryOpt.get().getQuantity() - inventoryOpt.get().getReserved() < entry.getValue()) {
                return false;
            }
        }
        return true;
    }

    @Override
    @Transactional
    public boolean reserveStock(Map<Long, Integer> menuItemQuantities) {
        if (!checkStock(menuItemQuantities)) {
            return false;
        }

        for (Map.Entry<Long, Integer> entry : menuItemQuantities.entrySet()) {
            int updated = inventoryRepository.reserveStock(entry.getKey(), entry.getValue());
            if (updated == 0) {
                throw new RuntimeException("Failed to reserve stock for menu item ID: " + entry.getKey());
            }
        }
        return true;
    }

    @Override
    @Transactional
    public boolean commitReservation(Map<Long, Integer> menuItemQuantities) {
        for (Map.Entry<Long, Integer> entry : menuItemQuantities.entrySet()) {
            int updated = inventoryRepository.commitReservation(entry.getKey(), entry.getValue());
            if (updated == 0) {
                throw new RuntimeException("Failed to commit reservation for menu item ID: " + entry.getKey());
            }
        }
        return true;
    }

    @Override
    @Transactional
    public boolean releaseReservation(Map<Long, Integer> menuItemQuantities) {
        for (Map.Entry<Long, Integer> entry : menuItemQuantities.entrySet()) {
            int updated = inventoryRepository.releaseReservation(entry.getKey(), entry.getValue());
            if (updated == 0) {
                throw new RuntimeException("Failed to release reservation for menu item ID: " + entry.getKey());
            }
        }
        return true;
    }

    @Override
    @Transactional
    public Inventory updateQuantity(Long menuItemId, Integer newQuantity) {
        Inventory inventory = getByMenuItemId(menuItemId);
        inventory.setQuantity(newQuantity);
        return inventoryRepository.save(inventory);
    }

    @Override
    @Transactional
    public Inventory updateThreshold(Long menuItemId, Integer newThreshold) {
        Inventory inventory = getByMenuItemId(menuItemId);
        inventory.setThreshold(newThreshold);
        return inventoryRepository.save(inventory);
    }
}