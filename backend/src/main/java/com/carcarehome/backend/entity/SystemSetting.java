package com.carcarehome.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "system_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemSetting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Banner settings
    private String bannerUrl;
    private String bannerTitle;
    private String bannerSubtitle;
    private String bannerButtonText;
    private String bannerButtonLink;

    // Popup settings
    private boolean popupEnabled;
    private String popupImageUrl;
    private String popupTitle;
    private String popupContent;
    private String popupLink;

    // Theme settings
    private String primaryColor;
    private String secondaryColor;
    private String backgroundColor;
    private String textColor;
    private String fontFamily;

    // Other configurations
    private String contactPhone;
    private String contactEmail;
    private String contactAddress;
    // Shop Geolocation
    private Double shopLat;
    private Double shopLng;
}
