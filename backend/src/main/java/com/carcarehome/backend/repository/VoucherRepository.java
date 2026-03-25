package com.carcarehome.backend.repository;

import com.carcarehome.backend.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    List<Voucher> findByStatus(String status);
    List<Voucher> findByStatusOrderByCreatedAtDesc(String status);
}
