package com.fastfood.management.mapper;

import com.fastfood.management.dto.response.MenuItemResponse;
import com.fastfood.management.entity.MenuItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface MenuItemMapper {

    @Mapping(target = "categoryName", source = "category.name")
    MenuItemResponse menuItemToMenuItemResponse(MenuItem menuItem);

    List<MenuItemResponse> menuItemsToMenuItemResponses(List<MenuItem> menuItems);
}