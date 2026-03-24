package com.carcarehome.backend.config;

import com.carcarehome.backend.repository.IRoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(IRoleRepository roleRepository) {
        return args -> {
            // Hardcoded seeding removed at user request.
        };
    }
}
