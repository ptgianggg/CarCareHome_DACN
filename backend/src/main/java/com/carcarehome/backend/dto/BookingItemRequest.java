package com.carcarehome.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class BookingItemRequest {
    private String vehicleType;
    private String vehiclePlate;
    private String serviceType;
    private BigDecimal price;
}
