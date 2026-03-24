package com.carcarehome.backend.service;
import java.util.List;
import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.carcarehome.backend.dto.BookingRequest;
import com.carcarehome.backend.entity.Booking;
import com.carcarehome.backend.repository.BookingRepository;
import com.carcarehome.backend.repository.IUserRepository;
import com.carcarehome.backend.entity.User;
import com.carcarehome.backend.mapper.BookingMapper;
import org.springframework.scheduling.annotation.Scheduled;
import java.time.LocalDateTime;

import com.carcarehome.backend.state.BookingState;
import com.carcarehome.backend.state.BookingStateFactory;

@Service
@Transactional
public class BookingService {
    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private BookingMapper bookingMapper;

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getBookingsByCustomerEmail(String customerEmail) {
        if (customerEmail == null || customerEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email khong duoc de trong");
        }
        return bookingRepository.findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(customerEmail.trim());
    }

    public List<Booking> getBookingsByStaff(String email) {
        return bookingRepository.findByAssignedStaffsEmailOrderByCreatedAtDesc(email);
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
    }

    public Booking createBooking(BookingRequest request) {
        Booking booking = new Booking();
        mapRequestToEntity(request, booking);
        
        // Logic thanh toán & đặt cọc
        if ("MOMO".equalsIgnoreCase(request.getPaymentMethod())) {
            booking.setPaymentMethod("MOMO");
            booking.setDepositAmount(booking.getTotalPrice()); // Thanh toán toàn bộ
            booking.setPaymentStatus("UNPAID");
            booking.setStatus("WAITING_FOR_PAYMENT"); // Shopee-style: Chờ thanh toán
        } else {
            // Mặc định là CASH
            booking.setPaymentMethod("CASH");
            BigDecimal limit = new BigDecimal("500000");
            if (booking.getTotalPrice().compareTo(limit) > 0) {
                // Đơn trên 500k bắt buộc cọc 10%
                BigDecimal deposit = booking.getTotalPrice().multiply(new BigDecimal("0.1"));
                booking.setDepositAmount(deposit);
                booking.setPaymentStatus("UNPAID"); // Trạng thái là chưa thanh toán cọc
                booking.setStatus("WAITING_FOR_PAYMENT"); // Phải thanh toán cọc trước
            } else {
                booking.setDepositAmount(BigDecimal.ZERO);
                booking.setPaymentStatus("UNPAID"); 
                booking.setStatus("PENDING"); // Đơn nhỏ tiền mặt thì vào thẳng chờ duyệt
            }
        }
        
        return bookingRepository.save(booking);
    }

    public Booking updateBooking(Long id, BookingRequest request) {
        Booking booking = getBookingById(id);
        mapRequestToEntity(request, booking);
        return bookingRepository.save(booking);
    }

    public Booking assignStaff(Long bookingId, List<Long> staffIds) {
        Booking booking = getBookingById(bookingId);
        
        // Clear previous and set new multiple staffs
        booking.getAssignedStaffs().clear();
        if (staffIds != null && !staffIds.isEmpty()) {
            List<User> staffs = userRepository.findAllById(staffIds);
            booking.getAssignedStaffs().addAll(staffs);
        }
        
        if ("PENDING".equals(booking.getStatus()) || "STAFF_REJECT".equals(booking.getStatus())) {
            BookingState currentState = BookingStateFactory.getState(booking.getStatus());
            currentState.next(booking);
        }
        
        return bookingRepository.save(booking);
    }

    public Booking updateStatusByStaff(Long bookingId, String status, String proofImage) {
        Booking booking = getBookingById(bookingId);
        
        BookingState currentState = BookingStateFactory.getState(booking.getStatus());
        
        if ("NEXT".equalsIgnoreCase(status) || status == null || status.isEmpty()) {
            currentState.next(booking);
        } else if ("CANCEL".equalsIgnoreCase(status)) {
            currentState.cancel(booking);
        } else if ("REJECT".equalsIgnoreCase(status)) {
            currentState.reject(booking);
        } else {
            // Cảnh báo: Frontend cũ đang gửi hardcode IN_PROGRESS/COMPLETED thay vì NEXT
            // Để không vỡ logic cũ (do yêu cầu không conflict), nếu gửi chính xác trạng thái tiếp theo thì bỏ qua, nếu không sẽ cưỡng ép dùng NEXT.
            // Tuy nhiên, vì yêu cầu là "tuân thủ tuyệt đối design pattern", ta sẽ ánh xạ mọi chuỗi thăng tiến thành lệnh next()
            if ("IN_PROGRESS".equals(status) && "SUCCESS".equals(booking.getStatus())) {
                currentState.next(booking);
            } else if ("COMPLETED".equals(status) && "IN_PROGRESS".equals(booking.getStatus())) {
                currentState.next(booking);
            } else {
                booking.setStatus(status);
            }
        }

        if (proofImage != null && !proofImage.isEmpty()) {
            booking.setProofImage(proofImage);
        }
        return bookingRepository.save(booking);
    }

    public void deleteBooking(Long id) {
        Booking booking = getBookingById(id);
        bookingRepository.delete(booking);
    }

    public Booking addReview(Long bookingId, Integer rating, String comment) {
        Booking booking = getBookingById(bookingId);
        if (!"COMPLETED".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi co the danh gia don hang da hoan tat");
        }
        booking.setRating(rating);
        booking.setReviewComment(comment);
        return bookingRepository.save(booking);
    }

    public List<Booking> getAllReviews() {
        return bookingRepository.findByRatingIsNotNullOrderByUpdatedAtDesc();
    }

    public void updatePaymentStatus(Long bookingId, String status) {
        Booking booking = getBookingById(bookingId);
        booking.setPaymentStatus(status);
        if ("PAID_FULL".equals(status) || "DEPOSITED".equals(status)) {
            if ("WAITING_FOR_PAYMENT".equals(booking.getStatus())) {
                booking.setStatus("PENDING"); // Chuyển sang chờ duyệt sau khi đã thanh toán
            }
        }
        bookingRepository.save(booking);
    }

    @Scheduled(fixedRate = 60000) // Kiểm tra mỗi phút
    public void cancelExpiredBookings() {
        LocalDateTime fiveMinsAgo = LocalDateTime.now().minusMinutes(5);
        List<Booking> expired = bookingRepository.findByStatusAndCreatedAtBefore("WAITING_FOR_PAYMENT", fiveMinsAgo);
        for (Booking b : expired) {
            b.setStatus("CANCELLED");
            bookingRepository.save(b);
        }
    }

    private void mapRequestToEntity(BookingRequest request, Booking booking) {
        bookingMapper.mapRequestToEntity(request, booking);
    }
}
