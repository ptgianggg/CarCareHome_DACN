package com.carcarehome.backend.config;

import com.carcarehome.backend.repository.IRoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(IRoleRepository roleRepository, JdbcTemplate jdbcTemplate) {
        return args -> {
            // Check if MANAGER exists and rename to STAFF to match new code standards
            roleRepository.findByName("MANAGER").ifPresent(role -> {
                if (roleRepository.findByName("STAFF").isEmpty()) {
                    role.setName("STAFF");
                    roleRepository.save(role);
                    System.out.println(">>> RENAMED ROLE MANAGER TO STAFF IN DATABASE");
                }
            });

            // Mở rộng cột status để chứa AWAITING_FINAL_PAYMENT (23 ký tự)
            try {
                jdbcTemplate.execute("ALTER TABLE bookings MODIFY COLUMN status VARCHAR(30) NOT NULL");
                System.out.println(">>> ALTER TABLE bookings: status column expanded to VARCHAR(30)");
            } catch (Exception e) {
                // Bỏ qua nếu đã đúng kích thước hoặc bảng chưa tồn tại
                System.out.println(">>> ALTER TABLE bookings status: " + e.getMessage());
            }
        };
    }
}
