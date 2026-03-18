package com.carcarehome.backend.config;

import com.carcarehome.backend.entity.Role;
import com.carcarehome.backend.repository.IRoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(IRoleRepository roleRepository) {
        return args -> {
            if (roleRepository.count() == 0) {
                // Tạo role ADMIN
                Role admin = new Role();
                admin.setName("ADMIN");
                admin.setDescription("Quản trị viên hệ thống");
                roleRepository.save(admin);

                // Tạo role USER (ID sẽ là 2 nếu auto-increment bắt đầu từ 1)
                Role user = new Role();
                user.setName("USER");
                user.setDescription("Người dùng thông thường");
                roleRepository.save(user);

                // Tạo role MANAGER
                Role manager = new Role();
                manager.setName("MANAGER");
                manager.setDescription("Quản lý cửa hàng");
                roleRepository.save(manager);
                
                System.out.println("Đã khởi tạo dữ liệu Role mặc định.");
            }
        };
    }
}
