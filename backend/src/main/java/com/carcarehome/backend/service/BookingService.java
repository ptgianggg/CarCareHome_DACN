package com.carcarehome.backend.service;

import com.carcarehome.backend.dto.BookingRequest;
import com.carcarehome.backend.entity.Booking;
import com.carcarehome.backend.entity.UserVoucher;
import com.carcarehome.backend.repository.BookingRepository;
import com.carcarehome.backend.repository.IUserRepository;
import com.carcarehome.backend.repository.IUserVoucherRepository;
import com.carcarehome.backend.entity.User;
import com.carcarehome.backend.entity.Voucher;
import com.carcarehome.backend.mapper.BookingMapper;
import com.carcarehome.backend.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;

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
    private IUserVoucherRepository userVoucherRepository;

    @Autowired
    private BookingMapper bookingMapper;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ServiceRepository serviceRepository;

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
        // 1. Kiểm tra khung giờ và KTV rảnh
        validateAvailability(request, null);

        Booking booking = new Booking();
        mapRequestToEntity(request, booking);

        // Recalculate price: Don't trust the client-provided prices for services
        BigDecimal calculatedServicesTotal = BigDecimal.ZERO;
        if (request.getItems() != null) {
            for (var itemReq : request.getItems()) {
                if (itemReq.getServiceIds() != null && !itemReq.getServiceIds().isEmpty()) {
                    for (Long sId : itemReq.getServiceIds()) {
                        com.carcarehome.backend.entity.Service s = serviceRepository.findById(sId).orElse(null);
                        if (s != null) {
                            calculatedServicesTotal = calculatedServicesTotal.add(BigDecimal.valueOf(s.getPrice()));
                        }
                    }
                } else if (itemReq.getPrice() != null) {
                    calculatedServicesTotal = calculatedServicesTotal.add(itemReq.getPrice());
                }
            }
        }
        
        // Nếu client gửi totalPrice mà không có items (đơn hàng cũ/đơn giản), lấy giá trị client
        if (calculatedServicesTotal.compareTo(BigDecimal.ZERO) == 0 && request.getTotalPrice() != null) {
            calculatedServicesTotal = request.getTotalPrice();
        }

        BigDecimal travelFee = request.getTravelFee() != null ? request.getTravelFee() : BigDecimal.ZERO;
        booking.setTravelFee(travelFee);
        booking.setTotalPrice(calculatedServicesTotal); // Set base price before discount

        // Áp dụng Voucher nếu có
        if (request.getUserVoucherId() != null) {
            UserVoucher uv = userVoucherRepository.findById(request.getUserVoucherId())
                    .orElseThrow(() -> new RuntimeException("Voucher không tồn tại"));

            if (uv.isUsed()) {
                throw new RuntimeException("Voucher này đã được sử dụng");
            }

            // Kiểm tra xem voucher có thuộc về customerEmail này không (nếu có email)
            if (request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank() &&
                !uv.getUser().getEmail().equalsIgnoreCase(request.getCustomerEmail().trim())) {
                throw new RuntimeException("Voucher không thuộc về tài khoản này");
            }

            Voucher v = uv.getVoucher();
            
            // Kiểm tra số lượng đơn hàng tối thiểu (Mới thêm)
            if (v.getRequiredBookingCount() != null && v.getRequiredBookingCount() > 0) {
                if (request.getCustomerEmail() == null || request.getCustomerEmail().isBlank()) {
                    throw new RuntimeException("Bạn cần đăng nhập để sử dụng khuyến mãi cho khách hàng thân thiết");
                }
                long completedCount = bookingRepository.countByCustomerEmailIgnoreCaseAndStatus(request.getCustomerEmail().trim(), "COMPLETED");
                if (completedCount < v.getRequiredBookingCount()) {
                    throw new RuntimeException("Bạn cần hoàn tất ít nhất " + v.getRequiredBookingCount() + " đơn hàng để sử dụng mã này. (Đã hoàn tất: " + completedCount + ")");
                }
            }

            // Kiểm tra giá trị đơn hàng tối thiểu
            BigDecimal baseTotal = calculatedServicesTotal.add(travelFee);
            if (v.getMinOrderValue() != null && baseTotal.compareTo(BigDecimal.valueOf(v.getMinOrderValue())) < 0 
                && !"FREE_WASH".equalsIgnoreCase(v.getDiscountType())) {
                throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu " + v.getMinOrderValue() + "đ để áp dụng mã này");
            }

            // Tính toán giảm giá
            BigDecimal discount = BigDecimal.ZERO;
            if ("CASH".equalsIgnoreCase(v.getDiscountType())) {
                discount = BigDecimal.valueOf(v.getDiscountValue());
            } else if ("PERCENT".equalsIgnoreCase(v.getDiscountType())) {
                discount = baseTotal.multiply(BigDecimal.valueOf(v.getDiscountValue()).divide(BigDecimal.valueOf(100)));
            } else if ("SERVICE".equalsIgnoreCase(v.getDiscountType())) {
                // Giảm 100% phí dịch vụ
                discount = calculatedServicesTotal;
            } else if ("FREE_WASH".equalsIgnoreCase(v.getDiscountType())) {
                // Tặng kèm 1 dịch vụ rửa xe rẻ nhất
                com.carcarehome.backend.entity.Service cheapestWash = serviceRepository.findFirstByCategoryContainingIgnoreCaseOrderByPriceAsc("rửa").orElse(null);
                if (cheapestWash != null) {
                    discount = BigDecimal.valueOf(cheapestWash.getPrice());
                    
                    // Phải cộng thêm giá trị của dịch vụ được tặng vào tổng tiền trước khi trừ đi ở discount
                    baseTotal = baseTotal.add(discount);

                    // Thêm item vào booking ngay lập tức (với giá 0đ)
                    com.carcarehome.backend.entity.BookingItem freeItem = new com.carcarehome.backend.entity.BookingItem();
                    freeItem.setServiceType(cheapestWash.getName() + " (Tặng kèm)");
                    freeItem.setPrice(BigDecimal.ZERO);
                    freeItem.setVehicleType(booking.getVehicleType() != null ? booking.getVehicleType() : "N/A");
                    freeItem.setVehiclePlate(booking.getVehiclePlate() != null ? booking.getVehiclePlate() : "N/A");
                    booking.addItem(freeItem);
                    
                    // Cập nhật serviceType text - để hiển thị đẹp hơn
                    if (booking.getServiceType() == null || booking.getServiceType().isBlank()) {
                        booking.setServiceType(freeItem.getServiceType());
                    } else if (!booking.getServiceType().contains(freeItem.getServiceType())) {
                        booking.setServiceType(booking.getServiceType() + " | " + freeItem.getServiceType());
                    }
                }
            }

            // Cập nhật lại tổng tiền sau giảm giá
            BigDecimal finalPrice = baseTotal.subtract(discount).max(BigDecimal.ZERO);
            booking.setTotalPrice(finalPrice);
            booking.setDiscountAmount(discount);
            booking.setVoucherCode(v.getCode());

            // Đánh dấu voucher đã sử dụng
            uv.setUsed(true);
            userVoucherRepository.save(uv);
        } else {
            // Nếu không dùng voucher, tổng tiền là totalPrice + travelFee
            booking.setTotalPrice(calculatedServicesTotal.add(travelFee));
            booking.setDiscountAmount(BigDecimal.ZERO);
        }
        
        // Logic thanh toán & đặt cọc (Dựa trên giá sau giảm giá)
        boolean skipDeposit = false;
        if (request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank()) {
            User customer = userRepository.findByEmail(request.getCustomerEmail().trim()).orElse(null);
            if (customer != null && ("GOLD".equalsIgnoreCase(customer.getTier()) || "VIP".equalsIgnoreCase(customer.getTier()))) {
                skipDeposit = true;
            }
        }

        if (skipDeposit) {
            booking.setDepositAmount(BigDecimal.ZERO);
            booking.setPaymentStatus("UNPAID");
            booking.setStatus("PENDING");
            booking.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH");
        } else if ("MOMO".equalsIgnoreCase(request.getPaymentMethod())) {
            booking.setPaymentMethod("MOMO");
            booking.setDepositAmount(booking.getTotalPrice()); 
            booking.setPaymentStatus("UNPAID");
            booking.setStatus("WAITING_FOR_PAYMENT"); 
        } else {
            booking.setPaymentMethod("CASH");
            BigDecimal limit = new BigDecimal("500000");
            if (booking.getTotalPrice().compareTo(limit) > 0) {
                BigDecimal deposit = booking.getTotalPrice().multiply(new BigDecimal("0.1"));
                booking.setDepositAmount(deposit);
                booking.setPaymentStatus("UNPAID");
                booking.setStatus("WAITING_FOR_PAYMENT");
            } else {
                booking.setDepositAmount(BigDecimal.ZERO);
                booking.setPaymentStatus("UNPAID"); 
                booking.setStatus("PENDING");
            }
        }
        
        Booking saved = bookingRepository.save(booking);
        
        // Nếu booking ở trạng thái PENDING ngay (vd tiền mặt < 500k), gửi mail xác nhận luôn
        if ("PENDING".equals(saved.getStatus())) {
            try {
                emailService.sendBookingConfirmationEmail(saved.getCustomerEmail(), saved);
            } catch (Exception e) {
                // Không để lỗi gửi mail làm fail transaction booking
                System.err.println("Gửi mail xác nhận thất bại: " + e.getMessage());
            }
        }
        
        return saved;
    }

    public Booking updateBooking(Long id, BookingRequest request) {
        Booking booking = getBookingById(id);
        
        // Kiểm tra xem việc cập nhật thời gian có gây ra trùng lịch không
        if (request.getBookingDate() != null && request.getBookingTime() != null) {
            validateAvailability(request, id);
        }
        
        mapRequestToEntity(request, booking);
        return bookingRepository.save(booking);
    }
    
    private void validateAvailability(BookingRequest request, Long excludeId) {
        java.time.LocalTime startTime = request.getBookingTime();
        if (startTime == null) return;
        
        java.time.LocalTime endTime = request.getBookingEndTime() != null ? 
                                     request.getBookingEndTime() : 
                                     startTime.plusMinutes(45);
        
        long totalStaff = userRepository.countStaff();
        
        long occupiedCount = bookingRepository.countOverlappingBookings(
                request.getBookingDate(), startTime, endTime, excludeId);
        
        if (occupiedCount >= totalStaff) {
            String msg = totalStaff == 0 ? 
                "Hệ thống hiện chưa có KTV nào sẵn sàng phục vụ." :
                "Khung giờ " + startTime + " - " + endTime + " ngày " + request.getBookingDate() + 
                " đã đủ người (Full " + occupiedCount + "/" + totalStaff + " KTV). Vui lòng chọn giờ khác.";
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
        }
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

        // Award points if completed
        if ("COMPLETED".equals(booking.getStatus())) {
            awardLoyaltyPoints(booking);
        }

        return bookingRepository.save(booking);
    }

    public void awardLoyaltyPoints(Booking booking) {
        if (!"COMPLETED".equals(booking.getStatus()) || booking.getPointsEarned() != null) {
            return;
        }

        String email = booking.getCustomerEmail();
        if (email == null || email.isBlank()) {
            return;
        }

        userRepository.findByEmail(email).ifPresent(user -> {
            BigDecimal totalPrice = booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO;
            BigDecimal travelFee = booking.getTravelFee() != null ? booking.getTravelFee() : BigDecimal.ZERO;
            
            BigDecimal serviceAmount = totalPrice.subtract(travelFee).max(BigDecimal.ZERO);
            // 10,000 VNĐ = 1 point
            int pointsToAdd = serviceAmount.divide(new BigDecimal("10000"), 0, java.math.RoundingMode.FLOOR).intValue();
            
            if (pointsToAdd > 0) {
                user.setPoints((user.getPoints() != null ? user.getPoints() : 0) + pointsToAdd);
                user.setPointsLifetime((user.getPointsLifetime() != null ? user.getPointsLifetime() : 0) + pointsToAdd);
                
                // Cập nhật hạng thành viên tự động
                updateUserTier(user);
                
                userRepository.save(user);
                booking.setPointsEarned(pointsToAdd);
            } else {
                booking.setPointsEarned(0);
            }
        });
    }

    private void updateUserTier(User user) {
        int lifetime = user.getPointsLifetime() != null ? user.getPointsLifetime() : 0;
        if (lifetime >= 5000) {
            user.setTier("VIP");
        } else if (lifetime >= 2000) {
            user.setTier("GOLD");
        } else if (lifetime >= 500) {
            user.setTier("SILVER");
        } else {
            user.setTier("BRONZE");
        }
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
        String oldStatus = booking.getStatus();
        booking.setPaymentStatus(status);
        
        if ("PAID_FULL".equals(status) || "DEPOSITED".equals(status)) {
            if ("WAITING_FOR_PAYMENT".equals(booking.getStatus())) {
                booking.setStatus("PENDING"); // Chuyển sang chờ duyệt sau khi đã thanh toán
            }
        }
        
        Booking saved = bookingRepository.save(booking);
        
        // Nếu chuyển từ WAITING_FOR_PAYMENT sang PENDING (do thanh toán thành công)
        if ("PENDING".equals(saved.getStatus()) && "WAITING_FOR_PAYMENT".equals(oldStatus)) {
            if (saved.getCustomerEmail() != null && !saved.getCustomerEmail().isBlank()) {
                try {
                    emailService.sendBookingConfirmationEmail(saved.getCustomerEmail(), saved);
                } catch (Exception e) {
                    System.err.println("Gửi mail xác nhận thất bại sau khi thanh toán cọc: " + e.getMessage());
                }
            }
        }
    }

    @Scheduled(fixedRate = 60000) // Kiểm tra mỗi phút
    public void cancelExpiredBookings() {
        LocalDateTime now = LocalDateTime.now();
        
        // 1. Hủy các đơn chờ thanh toán quá 5 phút (MoMo chưa trả tiền)
        LocalDateTime fiveMinsAgo = now.minusMinutes(5);
        List<Booking> unpaid = bookingRepository.findByStatusAndCreatedAtBefore("WAITING_FOR_PAYMENT", fiveMinsAgo);
        for (Booking b : unpaid) {
            b.setStatus("CANCELLED");
            bookingRepository.save(b);
        }

        // 2. Tự động hủy các đơn đã cọc nhưng quá giờ hẹn mà chưa phân công hoặc chưa bắt đầu
        // Kiểm tra các đơn PENDING hoặc SUCCESS đã quá giờ hẹn 30 phút
        List<Booking> allActive = bookingRepository.findAll();
        for (Booking b : allActive) {
            if (("PENDING".equals(b.getStatus()) || "SUCCESS".equals(b.getStatus()) || "STAFF_REJECT".equals(b.getStatus()))) {
                if (b.getBookingDate() != null && b.getBookingTime() != null) {
                    LocalDateTime scheduledTime = LocalDateTime.of(b.getBookingDate(), b.getBookingTime());
                    // Nếu quá giờ hẹn 30 phút mà vẫn chưa IN_PROGRESS thì hủy
                    if (scheduledTime.plusMinutes(30).isBefore(now)) {
                        b.setStatus("CANCEL");
                        b.getAssignedStaffs().clear();
                        bookingRepository.save(b);
                        System.out.println("Auto-cancelled stagnant booking: " + b.getId());
                    }
                }
            }
        }
    }

    private void mapRequestToEntity(BookingRequest request, Booking booking) {
        bookingMapper.mapRequestToEntity(request, booking);
    }
}
