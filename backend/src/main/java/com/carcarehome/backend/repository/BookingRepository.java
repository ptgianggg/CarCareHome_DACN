package com.carcarehome.backend.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.carcarehome.backend.entity.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {
}
