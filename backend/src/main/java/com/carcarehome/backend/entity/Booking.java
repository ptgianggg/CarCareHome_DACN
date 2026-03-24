package com.carcarehome.backend.entity;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Table;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.JoinTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.FetchType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
@Entity
@Data
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_method", length = 20)
    private String paymentMethod; // CASH, MOMO

    @Column(name = "payment_status", length = 30)
    private String paymentStatus; // UNPAID, DEPOSITED, PAID_FULL

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "booking_staff",
        joinColumns = @JoinColumn(name = "booking_id"),
        inverseJoinColumns = @JoinColumn(name = "staff_id")
    )
    private java.util.List<User> assignedStaffs = new java.util.ArrayList<>();

    @Column(name = "proof_image", columnDefinition = "LONGTEXT")
    private String proofImage;

    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String reviewComment;

    @Column(name = "customer_name", nullable = false, length = 120)
    private String customerName;

    @Column(name = "customer_phone", nullable = false, length = 20)
    private String customerPhone;

    @Column(name = "customer_email", length = 120)
    private String customerEmail;

    @Column(name = "vehicle_type", nullable = false, length = 50)
    private String vehicleType;

    @Column(name = "vehicle_plate", nullable = false, length = 20)
    private String vehiclePlate;

    @Column(name = "service_type", nullable = false, length = 120)
    private String serviceType;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "booking_time", nullable = false)
    private LocalTime bookingTime;

    @Column(name = "address_name", nullable = false, length = 120)
    private String addressName;

    @Column(length = 500)
    private String note;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "deposit_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal depositAmount;

    @Column(name = "distance")
    private Double distance;

    @Column(name = "travel_fee", precision = 12, scale = 2)
    private BigDecimal travelFee;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<BookingItem> items = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
    @JsonIgnore
    private java.util.List<Payment> payments = new java.util.ArrayList<>();

    /**
     * Tính số tiền còn lại khách hàng cần thanh toán
     */
    public BigDecimal getRemainingAmount() {
        BigDecimal total = totalPrice != null ? totalPrice : BigDecimal.ZERO;
        BigDecimal deposit = depositAmount != null ? depositAmount : BigDecimal.ZERO;
        if ("PAID_FULL".equals(paymentStatus)) {
            return BigDecimal.ZERO;
        }
        return total.subtract(deposit).max(BigDecimal.ZERO);
    }

    public void addItem(BookingItem item) {
        items.add(item);
        item.setBooking(this);
    }
    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (status == null || status.isBlank()) {
            status = "PENDING";
        }
        if (paymentStatus == null || paymentStatus.isBlank()) {
            paymentStatus = "UNPAID";
        }
        if (paymentMethod == null || paymentMethod.isBlank()) {
            paymentMethod = "CASH";
        }
        if (totalPrice == null) {
            totalPrice = BigDecimal.ZERO;
        }
        if (depositAmount == null) {
            depositAmount = BigDecimal.ZERO;
        }
        if (travelFee == null) {
            travelFee = BigDecimal.ZERO;
        }
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}


