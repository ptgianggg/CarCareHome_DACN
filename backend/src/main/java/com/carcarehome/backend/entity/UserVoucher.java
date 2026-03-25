package com.carcarehome.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "user_vouchers")
public class UserVoucher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "voucher_id", nullable = false)
    private Voucher voucher;

    private LocalDateTime redeemedAt;

    @Column(nullable = false)
    private boolean used = false;

    @PrePersist
    protected void onCreate() {
        redeemedAt = LocalDateTime.now();
    }
}
