package com.carcarehome.backend.service;

import com.carcarehome.backend.entity.Voucher;
import com.carcarehome.backend.entity.UserVoucher;
import com.carcarehome.backend.entity.User;
import com.carcarehome.backend.repository.VoucherRepository;
import com.carcarehome.backend.repository.IUserVoucherRepository;
import com.carcarehome.backend.repository.IUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VoucherService {
    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
    private IUserVoucherRepository userVoucherRepository;

    @Autowired
    private IUserRepository userRepository;

    public List<Voucher> getAllVouchers() {
        return voucherRepository.findAll();
    }

    public List<Voucher> getActiveVouchers() {
        return voucherRepository.findByStatusOrderByCreatedAtDesc("ACTIVE").stream()
                .filter(v -> {
                    java.time.LocalDateTime now = java.time.LocalDateTime.now();
                    boolean started = v.getStartDate() == null || !now.isBefore(v.getStartDate());
                    boolean notEnded = v.getEndDate() == null || !now.isAfter(v.getEndDate());
                    return started && notEnded;
                }).collect(java.util.stream.Collectors.toList());
    }

    public Voucher getVoucherById(Long id) {
        return voucherRepository.findById(id).orElseThrow(() -> new RuntimeException("Voucher not found"));
    }

    public Voucher createVoucher(Voucher voucher) {
        validateDates(voucher);
        if (voucher.getCode() == null || voucher.getCode().isEmpty()) {
            voucher.setCode("V" + System.currentTimeMillis() % 10000);
        }
        return voucherRepository.save(voucher);
    }

    public Voucher updateVoucher(Long id, Voucher request) {
        Voucher voucher = getVoucherById(id);
        validateDates(request);
        
        voucher.setCode(request.getCode());
        voucher.setTitle(request.getTitle());
        voucher.setDescription(request.getDescription());
        voucher.setPointsRequired(request.getPointsRequired());
        voucher.setDiscountType(request.getDiscountType());
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMinOrderValue(request.getMinOrderValue());
        voucher.setTargetTier(request.getTargetTier());
        voucher.setStatus(request.getStatus());
        voucher.setStartDate(request.getStartDate());
        voucher.setEndDate(request.getEndDate());
        
        return voucherRepository.save(voucher);
    }

    private void validateDates(Voucher v) {
        if (v.getStartDate() != null && v.getEndDate() != null) {
            if (v.getEndDate().isBefore(v.getStartDate())) {
                throw new RuntimeException("Ngày kết thúc phải sau ngày bắt đầu");
            }
        }
    }

    public void deleteVoucher(Long id) {
        voucherRepository.deleteById(id);
    }

    public Voucher toggleStatus(Long id) {
        Voucher voucher = getVoucherById(id);
        voucher.setStatus("ACTIVE".equals(voucher.getStatus()) ? "PAUSED" : "ACTIVE");
        return voucherRepository.save(voucher);
    }

    public UserVoucher redeemVoucherByEmail(String email, Long voucherId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Voucher voucher = getVoucherById(voucherId);

        // Check if already redeemed
        if (userVoucherRepository.findByUserAndVoucher(user, voucher).isPresent()) {
            throw new RuntimeException("Bạn đã đổi voucher này rồi!");
        }

        // Check points
        if (user.getPoints() < voucher.getPointsRequired()) {
            throw new RuntimeException("Không đủ điểm để đổi voucher này!");
        }

        // Deduct points
        user.setPoints(user.getPoints() - voucher.getPointsRequired());
        userRepository.save(user);

        // Create UserVoucher record
        UserVoucher uv = new UserVoucher();
        uv.setUser(user);
        uv.setVoucher(voucher);
        return userVoucherRepository.save(uv);
    }

    public List<UserVoucher> getMyVouchersByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userVoucherRepository.findByUser(user);
    }

    public List<Long> getUserVoucherIdsByEmail(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return List.of();
        return userVoucherRepository.findByUser(user).stream()
                .map(uv -> uv.getVoucher().getId())
                .collect(Collectors.toList());
    }
}
