package com.fastfood.management.dto.response;

import lombok.Data;

@Data
public class AddressResponse {
    private Long id;
    private String street;
    private String city;
    private String district;
    private String ward;
    private String postalCode;
    private String recipientName;
    private String phoneNumber;
    private Double latitude;
    private Double longitude;
    private Boolean isDefault;
}