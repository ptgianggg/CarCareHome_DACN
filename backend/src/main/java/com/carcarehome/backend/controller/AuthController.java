package com.carcarehome.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.carcarehome.backend.service.AuthService;
import com.carcarehome.backend.dto.LoginRequest;
import com.carcarehome.backend.dto.RegisterRequest;
import com.carcarehome.backend.dto.ForgotPasswordRequest;
import com.carcarehome.backend.dto.ResetPasswordRequest;
import com.carcarehome.backend.service.EmailService;
import com.carcarehome.backend.service.OTPService;
import jakarta.validation.Valid;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            Map<String, Object> result = authService.register(request);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            Map<String, Object> result = authService.login(request);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody com.carcarehome.backend.dto.GoogleLoginRequest request) {
        try {
            Map<String, Object> result = authService.loginWithGoogle(request.getTokenId());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request.getEmail()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            return ResponseEntity.ok(authService.resetPassword(request.getToken(), request.getNewPassword()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @Autowired
    private EmailService emailService;

    @Autowired
    private OTPService otpService;

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOTP(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không hợp lệ"));
        }
        String otp = otpService.generateOTP(email);
        try {
            emailService.sendOTPEmail(email, otp);
            return ResponseEntity.ok(Map.of("message", "Đã gửi mã OTP đến " + email));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi gửi OTP: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOTP(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        if (otpService.verifyOTP(email, otp)) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Xác thực OTP thành công"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Mã OTP không chính xác hoặc đã hết hạn"));
        }
    }
}