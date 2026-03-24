package com.carcarehome.backend.controller;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import com.carcarehome.backend.dto.BookingRequest;
import com.carcarehome.backend.entity.Booking;
import com.carcarehome.backend.service.BookingService;
@RestController
@RequestMapping({"/api/bookings", "/api/booking"})
@CrossOrigin(origins = "*")
public class BookingController {
    @Autowired
    private BookingService bookingService;

    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }

    @GetMapping("/user")
    public List<Booking> getBookingsByUser(
            @RequestParam(value = "email", required = false) String email,
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail) {
        String customerEmail = (email != null && !email.isBlank()) ? email : headerEmail;
        return bookingService.getBookingsByCustomerEmail(customerEmail);
    }

    @GetMapping("/{id}")
    public Booking getBookingById(@PathVariable("id") Long id) {
        return bookingService.getBookingById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Booking createBooking(@RequestBody BookingRequest request) {
        return bookingService.createBooking(request);
    }
    @PutMapping("/{id}")
    public Booking updateBooking(@PathVariable("id") Long id, @RequestBody BookingRequest request) {
        return bookingService.updateBooking(id, request);
    }

    @GetMapping("/staff")
    public List<Booking> getStaffBookings(@RequestParam("email") String email) {
        return bookingService.getBookingsByStaff(email);
    }

    @PutMapping("/{id}/assign")
    public Booking assignStaff(@PathVariable("id") Long id, @RequestParam("staffId") List<Long> staffIds) {
        return bookingService.assignStaff(id, staffIds);
    }

    @PutMapping("/{id}/status")
    public Booking updateStaffStatus(
            @PathVariable("id") Long id, 
            @RequestBody java.util.Map<String, String> payload) {
        String status = payload.get("status");
        String proofImage = payload.get("proofImage");
        return bookingService.updateStatusByStaff(id, status, proofImage);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBooking(@PathVariable("id") Long id) {
        bookingService.deleteBooking(id);
    }

    @PutMapping("/{id}/review")
    public Booking addReview(
            @PathVariable("id") Long id,
            @RequestParam("rating") Integer rating,
            @RequestParam(value = "comment", required = false) String comment) {
        return bookingService.addReview(id, rating, comment);
    }

    @GetMapping("/reviews")
    public List<Booking> getReviews() {
        return bookingService.getAllReviews();
    }
}
