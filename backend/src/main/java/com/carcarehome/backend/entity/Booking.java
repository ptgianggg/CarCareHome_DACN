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
import lombok.Data;
@Entity
@Data
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    @Column(nullable = false, length = 20)
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

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<BookingItem> items = new java.util.ArrayList<>();

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


