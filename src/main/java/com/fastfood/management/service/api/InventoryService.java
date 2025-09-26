package com.fastfood.management.service.api;

import com.fastfood.management.entity.Inventory;
import com.fastfood.management.entity.MenuItem;

import java.util.List;
import java.util.Map;

public interface InventoryService {
    
    /**
     * Get inventory item by menu item ID
     */
    Inventory getByMenuItemId(Long menuItemId);
    
    /**
     * Get all inventory items
     */
    List<Inventory> getAllInventory();
    
    /**
     * Get all low stock items (quantity <= threshold)
     */
    List<Inventory> getLowStockItems();
    
    /**
     * Check if there's enough stock for the given menu items and quantities
     * @return true if all items have sufficient stock, false otherwise
     */
    boolean checkStock(Map<Long, Integer> menuItemQuantities);
    
    /**
     * Reserve stock for the given menu items and quantities
     * @return true if reservation was successful, false otherwise
     */
    boolean reserveStock(Map<Long, Integer> menuItemQuantities);
    
    /**
     * Commit reserved stock (reduce quantity by reserved amount)
     * @return true if commit was successful, false otherwise
     */
    boolean commitReservation(Map<Long, Integer> menuItemQuantities);
    
    /**
     * Release reserved stock (reduce reserved amount)
     * @return true if release was successful, false otherwise
     */
    boolean releaseReservation(Map<Long, Integer> menuItemQuantities);
    
    /**
     * Update inventory quantity
     */
    Inventory updateQuantity(Long menuItemId, Integer newQuantity);
    
    /**
     * Update inventory threshold
     */
    Inventory updateThreshold(Long menuItemId, Integer newThreshold);
}