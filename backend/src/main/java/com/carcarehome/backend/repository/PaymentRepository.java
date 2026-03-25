package com.carcarehome.backend.repository;

import com.carcarehome.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBookingIdOrderByCreatedAtDesc(Long bookingId);
    List<Payment> findByBookingIdAndStatus(Long bookingId, String status);
    List<Payment> findByBookingIdAndTransactionType(Long bookingId, String transactionType);
}
