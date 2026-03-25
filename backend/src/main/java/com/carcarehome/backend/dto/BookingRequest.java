package com.carcarehome.backend.dto;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
@Data
public class BookingRequest {
    @NotBlank(message = "Tên khách hàng không được để trống")
    private String customerName;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String customerPhone;

    @NotBlank(message = "Email không được để trống")
    @jakarta.validation.constraints.Email(message = "Email không hợp lệ")
    private String customerEmail;

    @NotBlank(message = "Loại xe không được để trống")
    private String vehicleType;

    @NotBlank(message = "Biển số xe không được để trống")
    private String vehiclePlate;

    @NotBlank(message = "Loại dịch vụ không được để trống")
    private String serviceType;

    @jakarta.validation.constraints.NotNull(message = "Ngày đặt lịch không được để trống")
    private LocalDate bookingDate;

    @jakarta.validation.constraints.NotNull(message = "Giờ đặt lịch không được để trống")
    private LocalTime bookingTime;

    private LocalTime bookingEndTime;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String addressName;

    private String note;
    private String status;
    private BigDecimal totalPrice;
    private BigDecimal depositAmount;
    private Double distance;
    private BigDecimal travelFee;
    private String paymentMethod;
    private Long userVoucherId;
    private java.util.List<BookingItemRequest> items;
}
