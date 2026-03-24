package com.carcarehome.backend.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.carcarehome.backend.dto.LeaveRequestDto;
import com.carcarehome.backend.service.LeaveRequestService;

@RestController
@RequestMapping("/api/leaves")
public class LeaveRequestController {

    @Autowired
    private LeaveRequestService leaveService;

    @PostMapping
    public LeaveRequestDto createLeave(@RequestParam String email, @RequestBody LeaveRequestDto request) {
        return leaveService.createLeaveRequest(email, request);
    }

    @GetMapping("/my")
    public List<LeaveRequestDto> getMyLeaves(@RequestParam String email) {
        return leaveService.getMyLeaves(email);
    }

    @GetMapping
    public List<LeaveRequestDto> getAllLeaves() {
        return leaveService.getAllLeaves();
    }

    @PutMapping("/{id}/status")
    public LeaveRequestDto updateStatus(@PathVariable Long id, @RequestParam String status) {
        return leaveService.updateStatus(id, status);
    }
}
