package com.fastfood.management.model;

import com.fastfood.management.entity.Inventory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryDTO {
    private Long id;
    private MenuItemDTO menuItem;
    private Integer quantity;
    private Integer threshold;
    private Integer reserved;

    public static InventoryDTO fromEntity(Inventory inventory) {
        return InventoryDTO.builder()
                .id(inventory.getId())
                .menuItem(MenuItemDTO.fromEntity(inventory.getMenuItem()))
                .quantity(inventory.getQuantity())
                .threshold(inventory.getThreshold())
                .reserved(inventory.getReserved())
                .build();
    }
}