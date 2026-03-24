package com.carcarehome.backend.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.carcarehome.backend.dto.LeaveRequestDto;
import com.carcarehome.backend.entity.LeaveRequest;
import com.carcarehome.backend.entity.User;
import com.carcarehome.backend.repository.LeaveRequestRepository;
import com.carcarehome.backend.repository.IUserRepository;

@Service
@Transactional
public class LeaveRequestService {

    @Autowired
    private LeaveRequestRepository leaveRepository;

    @Autowired
    private IUserRepository userRepository;

    public LeaveRequestDto createLeaveRequest(String email, LeaveRequestDto request) {
        User staff = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Staff not found"));

        // Validate dates
        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Xin nghỉ không được chọn ngày trong quá khứ");
        }
        
        long daysBetween = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate());
        if (daysBetween < 0 || daysBetween > 1) { // 0 = 1 day, 1 = 2 days
            throw new RuntimeException("Chỉ được xin nghỉ tối đa 2 ngày liên tiếp");
        }

        LeaveRequest leave = new LeaveRequest();
        leave.setStaff(staff);
        leave.setStartDate(request.getStartDate());
        leave.setEndDate(request.getEndDate());
        leave.setReason(request.getReason());
        leave.setStatus("PENDING");

        return mapToDto(leaveRepository.save(leave));
    }

    public List<LeaveRequestDto> getMyLeaves(String email) {
        return leaveRepository.findByStaffEmailOrderByCreatedAtDesc(email)
            .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<LeaveRequestDto> getAllLeaves() {
        return leaveRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public LeaveRequestDto updateStatus(Long id, String status) {
        LeaveRequest leave = leaveRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("LeaveRequest not found"));
        leave.setStatus(status);
        return mapToDto(leaveRepository.save(leave));
    }

    private LeaveRequestDto mapToDto(LeaveRequest entity) {
        LeaveRequestDto dto = new LeaveRequestDto();
        dto.setId(entity.getId());
        dto.setStaffId(entity.getStaff().getId());
        dto.setStaffName(entity.getStaff().getName());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setReason(entity.getReason());
        dto.setStatus(entity.getStatus());
        return dto;
    }
}
