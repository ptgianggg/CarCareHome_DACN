package com.carcarehome.backend.dto;
import java.time.LocalDate;
import lombok.Data;

@Data
public class LeaveRequestDto {
    private Long id;
    private Long staffId;
    private String staffName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private String status;
}
