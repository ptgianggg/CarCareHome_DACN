package com.carcarehome.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.carcarehome.backend.entity.Service;

public interface ServiceRepository extends JpaRepository<Service, Long> {
}
