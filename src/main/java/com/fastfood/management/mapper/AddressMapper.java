package com.fastfood.management.mapper;

import com.fastfood.management.dto.response.AddressResponse;
import com.fastfood.management.entity.Address;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    @Mapping(target = "isDefault", source = "defaultAddress")
    AddressResponse addressToAddressResponse(Address address);

    List<AddressResponse> addressesToAddressResponses(List<Address> addresses);
}