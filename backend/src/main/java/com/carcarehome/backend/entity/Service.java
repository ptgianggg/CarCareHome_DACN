package com.carcarehome.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "services")
public class Service {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private String category;
    private Double price;
    private Double originalPrice;
    private Integer discountPercentage;
    private String imageUrl;
    private Integer duration;
    private Boolean active;
    private String storeName;
    private String storeAddress;
}
