package com.carcarehome.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.carcarehome.backend.entity.Role;

@Repository
public interface IRoleRepository extends JpaRepository<Role, Long> {
    java.util.Optional<Role> findByName(String name);
}