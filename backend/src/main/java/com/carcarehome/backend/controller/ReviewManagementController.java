package com.carcarehome.backend.controller;

import com.carcarehome.backend.entity.Booking;
import com.carcarehome.backend.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reviews")
@PreAuthorize("hasRole('ADMIN')")
public class ReviewManagementController {

    @Autowired
    private BookingRepository bookingRepository;

    @GetMapping
    public ResponseEntity<List<Booking>> getAllReviews() {
        return ResponseEntity.ok(bookingRepository.findByRatingIsNotNullOrderByUpdatedAtDesc());
    }

    @PutMapping("/{id}/toggle-visibility")
    public ResponseEntity<Booking> toggleVisibility(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // Null check for safety
        if (booking.getShowOnHome() == null) {
            booking.setShowOnHome(false);
        }
        
        booking.setShowOnHome(!booking.getShowOnHome());
        return ResponseEntity.ok(bookingRepository.save(booking));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Booking> deleteReview(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // Chỉ xóa nội dung review, không xóa đơn hàng
        booking.setRating(null);
        booking.setReviewComment(null);
        booking.setShowOnHome(false);
        
        return ResponseEntity.ok(bookingRepository.save(booking));
    }
}
