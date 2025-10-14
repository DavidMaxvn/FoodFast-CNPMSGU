package com.fastfood.management.service.impl;

import com.fastfood.management.exception.ResourceNotFoundException;
import com.fastfood.management.model.InventoryDTO;
import com.fastfood.management.repository.InventoryRepository;
import com.fastfood.management.service.api.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<InventoryDTO> getInventoryByStore(Long storeId) {
        return inventoryRepository.findByMenuItem_Store_Id(storeId).stream()
                .map(InventoryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InventoryDTO updateInventory(Long inventoryId, int quantity) {
        if (quantity < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative.");
        }

        return inventoryRepository.findById(inventoryId).map(inventory -> {
            inventory.setQuantity(quantity);
            return InventoryDTO.fromEntity(inventoryRepository.save(inventory));
        }).orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with id: " + inventoryId));
    }
}