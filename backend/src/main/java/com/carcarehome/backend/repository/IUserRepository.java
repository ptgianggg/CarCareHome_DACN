package com.carcarehome.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.carcarehome.backend.entity.User;
import java.util.Optional;

@Repository
public interface IUserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = 'STAFF' OR u.role.name = 'ROLE_STAFF'")
    long countStaff();
}
