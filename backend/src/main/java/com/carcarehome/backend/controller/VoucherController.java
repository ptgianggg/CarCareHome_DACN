package com.carcarehome.backend.controller;

import com.carcarehome.backend.entity.Voucher;
import com.carcarehome.backend.service.VoucherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/vouchers")
public class VoucherController {
    @Autowired
    private VoucherService voucherService;

    // Public endpoint for users to see active vouchers
    @GetMapping("/active")
    public List<Voucher> getActiveVouchers() {
        return voucherService.getActiveVouchers();
    }

    // Admin endpoints
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Voucher> getAllVouchers() {
        return voucherService.getAllVouchers();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Voucher> createVoucher(@RequestBody Voucher voucher) {
        return ResponseEntity.ok(voucherService.createVoucher(voucher));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Voucher> updateVoucher(@PathVariable Long id, @RequestBody Voucher voucher) {
        return ResponseEntity.ok(voucherService.updateVoucher(id, voucher));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteVoucher(@PathVariable Long id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/redeem")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> redeemVoucher(@PathVariable Long id) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(voucherService.redeemVoucherByEmail(email, id));
    }

    @GetMapping("/my-vouchers")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyVouchers() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(voucherService.getMyVouchersByEmail(email));
    }

    @GetMapping("/my-voucher-ids")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyVoucherIds() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(voucherService.getUserVoucherIdsByEmail(email));
    }
}

