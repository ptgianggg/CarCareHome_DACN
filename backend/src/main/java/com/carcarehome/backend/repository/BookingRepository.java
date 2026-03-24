package com.carcarehome.backend.repository;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.carcarehome.backend.entity.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(String customerEmail);
    List<Booking> findByAssignedStaffEmailOrderByCreatedAtDesc(String email);
    List<Booking> findByAssignedStaffIdOrderByCreatedAtDesc(Long staffId);
}
