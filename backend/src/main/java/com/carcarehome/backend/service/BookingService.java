package com.carcarehome.backend.service;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.carcarehome.backend.dto.BookingRequest;
import com.carcarehome.backend.entity.Booking;
import com.carcarehome.backend.repository.BookingRepository;

@Service

public class BookingService {
    @Autowired
    private BookingRepository bookingRepository;

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
    }

    public Booking createBooking(BookingRequest request) {
        Booking booking = new Booking();
        mapRequestToEntity(request, booking);
        return bookingRepository.save(booking);
    }

    public Booking updateBooking(Long id, BookingRequest request) {
        Booking booking = getBookingById(id);
        mapRequestToEntity(request, booking);
        return bookingRepository.save(booking);
    }

    public void deleteBooking(Long id) {
        Booking booking = getBookingById(id);
        bookingRepository.delete(booking);
    }

    private void mapRequestToEntity(BookingRequest request, Booking booking) {
        booking.setCustomerName(request.getCustomerName());
        booking.setCustomerPhone(request.getCustomerPhone());
        booking.setCustomerEmail(request.getCustomerEmail());
        booking.setVehicleType(request.getVehicleType());
        booking.setVehiclePlate(request.getVehiclePlate());
        booking.setServiceType(request.getServiceType());
        booking.setBookingDate(request.getBookingDate());
        booking.setBookingTime(request.getBookingTime());
        booking.setAddressName(request.getAddressName());
        booking.setNote(request.getNote());
        booking.setStatus(request.getStatus());
        booking.setTotalPrice(request.getTotalPrice());
java.math.BigDecimal total =
                request.getTotalPrice() != null ? request.getTotalPrice() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal deposit =
                request.getDepositAmount() != null ? request.getDepositAmount() : java.math.BigDecimal.ZERO;

        if (deposit.compareTo(java.math.BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tien coc khong duoc am");
        }

        java.math.BigDecimal maxDeposit = total.multiply(new java.math.BigDecimal("0.5"));
        if (deposit.compareTo(maxDeposit) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tien coc khong duoc vuot qua 50% tong tien dich vu"
            );
        }

        booking.setDepositAmount(deposit);
    }
}
