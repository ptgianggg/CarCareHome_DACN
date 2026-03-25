package com.carcarehome.backend.controller;

import com.carcarehome.backend.repository.BookingRepository;
import com.carcarehome.backend.repository.IUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private IUserRepository userRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // 1. Tổng doanh thu
        stats.put("totalRevenue", bookingRepository.calculateTotalRevenue());
        
        // 2. Tổng đơn chờ xử lý
        stats.put("pendingBookings", bookingRepository.countPendingBookings());
        
        // 3. Phân bổ trạng thái
        stats.put("statusDistribution", bookingRepository.countBookingsByStatus());
        
        // 4. Doanh thu gần đây (Trend)
        stats.put("dailyRevenue", bookingRepository.getRecentDailyRevenue());
        
        // 5. Tổng số người dùng
        stats.put("totalUsers", userRepository.count());
        
        // 6. Xếp hạng nhân viên (Dựa trên đánh giá)
        stats.put("staffPerformance", bookingRepository.getStaffPerformance());
        
        // 7. Hoạt động gần đây (5 đơn hàng mới nhất)
        stats.put("recentActivities", bookingRepository.findTop5ByOrderByCreatedAtDesc());
        
        return ResponseEntity.ok(stats);
    }
}
