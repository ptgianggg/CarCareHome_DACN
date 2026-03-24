package com.carcarehome.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", nullable = false, length = 20)
    private String paymentMethod; // CASH, MOMO

    @Column(name = "transaction_type", nullable = false, length = 20)
    private String transactionType; // DEPOSIT (đặt cọc), REMAINING (thanh toán phần còn lại), FULL (thanh toán toàn bộ)

    @Column(name = "transaction_id", length = 100)
    private String transactionId; // Mã giao dịch MoMo (nếu có)

    @Column(name = "status", nullable = false, length = 20)
    private String status; // SUCCESS, FAILED, PENDING

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null || status.isBlank()) {
            status = "PENDING";
        }
    }
}
