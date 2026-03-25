package com.carcarehome.backend.controller;

import com.carcarehome.backend.entity.Booking;
import com.carcarehome.backend.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/reviews")
public class ReviewPublicController {

    @Autowired
    private BookingRepository bookingRepository;

    @GetMapping
    public ResponseEntity<List<Booking>> getFeaturedReviews() {
        // Chỉ lấy những đánh giá có đánh dấu hiển thị ở trang chủ
        return ResponseEntity.ok(bookingRepository.findByShowOnHomeTrueOrderByUpdatedAtDesc());
    }
}
