package com.carcarehome.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.carcarehome.backend.entity.Booking;
import com.carcarehome.backend.entity.Payment;
import com.carcarehome.backend.service.PaymentService;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    /**
     * KTV nhấn "Thanh toán tiền mặt" → nhận tiền → cập nhật hệ thống
     * PUT /api/payments/{bookingId}/cash
     */
    @PutMapping("/{bookingId}/cash")
    public ResponseEntity<?> processCashPayment(@PathVariable("bookingId") Long bookingId) {
        try {
            Booking booking = paymentService.processCashPayment(bookingId);
            return ResponseEntity.ok(Map.of(
                    "message", "Đã xác nhận thanh toán tiền mặt thành công",
                    "bookingId", booking.getId(),
                    "status", booking.getStatus(),
                    "paymentStatus", booking.getPaymentStatus()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Lấy lịch sử thanh toán của một booking
     * GET /api/payments/{bookingId}/history
     */
    @GetMapping("/{bookingId}/history")
    public ResponseEntity<List<Payment>> getPaymentHistory(@PathVariable("bookingId") Long bookingId) {
        List<Payment> payments = paymentService.getPaymentsByBookingId(bookingId);
        return ResponseEntity.ok(payments);
    }
}
