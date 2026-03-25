package com.carcarehome.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "vouchers")
public class Voucher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "points_required", nullable = false)
    private Integer pointsRequired = 0;

    @Column(name = "discount_type", nullable = false)
    private String discountType; // CASH, PERCENT, SERVICE

    @Column(name = "discount_value", nullable = false)
    private Double discountValue = 0.0;

    @Column(name = "min_order_value")
    private Double minOrderValue = 0.0;

    @Column(name = "target_tier")
    private String targetTier = "ALL"; // ALL, BRONZE, SILVER, GOLD, VIP

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, PAUSED

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
