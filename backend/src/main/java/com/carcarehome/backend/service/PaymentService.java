package com.carcarehome.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.carcarehome.backend.entity.Booking;
import com.carcarehome.backend.entity.Payment;
import com.carcarehome.backend.repository.BookingRepository;
import com.carcarehome.backend.repository.PaymentRepository;
import com.carcarehome.backend.state.BookingState;
import com.carcarehome.backend.state.BookingStateFactory;

@Service
@Transactional
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    /**
     * Thanh toán tiền mặt (COD) - KTV nhận tiền trực tiếp từ khách hàng
     */
    public Booking processCashPayment(Long bookingId) {
        Booking booking = findBookingOrThrow(bookingId);

        // Validate: chỉ thanh toán khi đơn ở trạng thái AWAITING_FINAL_PAYMENT
        if (!"AWAITING_FINAL_PAYMENT".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Đơn hàng không ở trạng thái chờ thanh toán. Trạng thái hiện tại: " + booking.getStatus());
        }

        BigDecimal remainingAmount = booking.getRemainingAmount();

        // Tạo bản ghi Payment
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(remainingAmount);
        payment.setPaymentMethod("CASH");
        payment.setTransactionType("REMAINING");
        payment.setStatus("SUCCESS");
        payment.setNote("KTV thu tiền mặt trực tiếp");
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Cập nhật trạng thái thanh toán
        booking.setPaymentStatus("PAID_FULL");
        booking.setPaymentMethod("CASH");

        // Chuyển sang COMPLETED via State Pattern
        BookingState state = BookingStateFactory.getState(booking.getStatus());
        state.next(booking);

        return bookingRepository.save(booking);
    }

    /**
     * Tạo thanh toán MoMo cho phần tiền còn lại (không phải cọc)
     * Trả về số tiền cần thanh toán để MomoController tạo QR
     */
    public BigDecimal calculateRemainingForMomo(Long bookingId) {
        Booking booking = findBookingOrThrow(bookingId);

        if (!"AWAITING_FINAL_PAYMENT".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Đơn hàng không ở trạng thái chờ thanh toán cuối");
        }

        BigDecimal remaining = booking.getRemainingAmount();
        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Không còn số tiền nào cần thanh toán");
        }

        return remaining;
    }

    /**
     * Xử lý callback khi MoMo thanh toán phần còn lại thành công
     */
    public void handleMomoRemainingPaymentSuccess(Long bookingId, String transactionId) {
        Booking booking = findBookingOrThrow(bookingId);

        BigDecimal remainingAmount = booking.getRemainingAmount();

        // Tạo bản ghi Payment
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(remainingAmount);
        payment.setPaymentMethod("MOMO");
        payment.setTransactionType("REMAINING");
        payment.setTransactionId(transactionId);
        payment.setStatus("SUCCESS");
        payment.setNote("Thanh toán phần còn lại qua MoMo");
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Cập nhật trạng thái
        booking.setPaymentStatus("PAID_FULL");

        // Nếu đang ở AWAITING_FINAL_PAYMENT → chuyển sang COMPLETED
        if ("AWAITING_FINAL_PAYMENT".equals(booking.getStatus())) {
            BookingState state = BookingStateFactory.getState(booking.getStatus());
            state.next(booking);
        }

        bookingRepository.save(booking);
    }

    /**
     * Ghi nhận thanh toán cọc đã thành công (gọi từ MomoController callback)
     */
    public void recordDepositPayment(Long bookingId, String transactionId, BigDecimal amount) {
        Booking booking = findBookingOrThrow(bookingId);

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(amount);
        payment.setPaymentMethod("MOMO");
        payment.setTransactionType("DEPOSIT");
        payment.setTransactionId(transactionId);
        payment.setStatus("SUCCESS");
        payment.setNote("Thanh toán đặt cọc qua MoMo");
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);
    }

    /**
     * Lấy lịch sử thanh toán của một booking
     */
    public List<Payment> getPaymentsByBookingId(Long bookingId) {
        return paymentRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);
    }

    private Booking findBookingOrThrow(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy đơn hàng: " + bookingId));
    }
}
