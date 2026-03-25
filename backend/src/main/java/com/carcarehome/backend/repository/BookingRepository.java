package com.carcarehome.backend.repository;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.carcarehome.backend.entity.Booking;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.time.LocalTime;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(String customerEmail);
    List<Booking> findByAssignedStaffsEmailOrderByCreatedAtDesc(String email);
    List<Booking> findByAssignedStaffsIdOrderByCreatedAtDesc(Long staffId);
    List<com.carcarehome.backend.entity.Booking> findByStatusAndCreatedAtBefore(String status, java.time.LocalDateTime time);
    List<Booking> findByRatingIsNotNullOrderByUpdatedAtDesc();
    List<Booking> findByShowOnHomeTrueOrderByUpdatedAtDesc();
    List<Booking> findTop5ByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(b.totalPrice), 0) FROM Booking b WHERE b.status = 'COMPLETED'")
    Double calculateTotalRevenue();

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = 'PENDING'")
    long countPendingBookings();

    @Query("SELECT b.status, COUNT(b) FROM Booking b GROUP BY b.status")
    List<Object[]> countBookingsByStatus();

    @Query("SELECT b.bookingDate, SUM(b.totalPrice) FROM Booking b " +
           "WHERE b.status = 'COMPLETED' " +
           "GROUP BY b.bookingDate " +
           "ORDER BY b.bookingDate DESC")
    List<Object[]> getRecentDailyRevenue();

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.bookingDate = :date " +
           "AND b.status NOT IN ('CANCELLED', 'REJECTED', 'CANCEL') " +
           "AND (:id IS NULL OR b.id <> :id) " +
           "AND (:newStart < b.bookingEndTime AND :newEnd > b.bookingTime)")
    long countOverlappingBookings(@Param("date") LocalDate date, 
                                  @Param("newStart") LocalTime newStart, 
                                  @Param("newEnd") LocalTime newEnd,
                                  @Param("id") Long id);

    @Query("SELECT s.name, s.avatar, AVG(b.rating), COUNT(b) FROM Booking b JOIN b.assignedStaffs s " +
           "WHERE b.rating IS NOT NULL " +
           "GROUP BY s.id, s.name, s.avatar " +
           "ORDER BY AVG(b.rating) DESC")
    List<Object[]> getStaffPerformance();

    @Query("SELECT AVG(b.rating), COUNT(b) FROM Booking b JOIN b.assignedStaffs s " +
           "WHERE s.id = :staffId AND b.rating IS NOT NULL")
    Object[] getStaffPerformanceById(@Param("staffId") Long staffId);
}
