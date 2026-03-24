package com.carcarehome.backend.dto;

import lombok.Data;

@Data
public class UserUpdateRequest {
    private String name;
    private String phone;
}
