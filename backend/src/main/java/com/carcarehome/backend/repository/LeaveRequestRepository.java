package com.carcarehome.backend.repository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.carcarehome.backend.entity.LeaveRequest;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByStaffEmailOrderByCreatedAtDesc(String email);
    List<LeaveRequest> findAllByOrderByCreatedAtDesc();

    // Find if staff has an APPROVED leave intersecting with a given date
    @Query("SELECT COUNT(l) FROM LeaveRequest l WHERE l.staff.id = :staffId AND l.status = 'APPROVED' AND :checkDate BETWEEN l.startDate AND l.endDate")
    long countActiveLeavesForStaff(@Param("staffId") Long staffId, @Param("checkDate") LocalDate checkDate);
}
