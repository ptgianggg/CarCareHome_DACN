package com.carcarehome.backend.repository;

import com.carcarehome.backend.entity.UserVoucher;
import com.carcarehome.backend.entity.User;
import com.carcarehome.backend.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface IUserVoucherRepository extends JpaRepository<UserVoucher, Long> {
    List<UserVoucher> findByUser(User user);
    Optional<UserVoucher> findByUserAndVoucher(User user, Voucher voucher);
    List<UserVoucher> findByUserAndUsedFalse(User user);
}
