package com.carcarehome.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import com.carcarehome.backend.dto.LoginRequest;
import com.carcarehome.backend.dto.RegisterRequest;
import com.carcarehome.backend.entity.User;
import com.carcarehome.backend.entity.Role;
import com.carcarehome.backend.repository.IUserRepository;
import com.carcarehome.backend.repository.IRoleRepository;
import com.carcarehome.backend.repository.IPasswordResetTokenRepository;
import com.carcarehome.backend.entity.PasswordResetToken;
import com.carcarehome.backend.security.JwtUtil;
import org.springframework.transaction.annotation.Transactional;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AuthService {

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private IRoleRepository roleRepository;

    @Autowired
    private IPasswordResetTokenRepository tokenRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${google.client.id}")
    private String googleClientId;

    public Map<String, Object> register(RegisterRequest request) {
        // Kiểm tra email đã tồn tại chưa
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            throw new RuntimeException("Email đã được sử dụng. Vui lòng dùng email khác.");
        }

        // Tạo user mới
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        // Hash password trước khi lưu
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        // Mặc định gán role USER bằng cách tìm theo tên
        Role defaultRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("Lỗi: Role USER không tồn tại trong hệ thống."));
        user.setRole(defaultRole);


        User savedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("id", savedUser.getId());
        response.put("name", savedUser.getName());
        response.put("email", savedUser.getEmail());
        response.put("role", savedUser.getRole().getName());
        response.put("message", "Đăng ký thành công!");
        return response;
    }

    public Map<String, Object> login(LoginRequest request) {
        // Tìm user theo email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại."));

        // Kiểm tra password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu không đúng.");
        }

        // Tạo JWT token (lấy tên của Role)
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().getName());


        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole().getName());
        response.put("token", token); // ← Trả về JWT Access Token

        response.put("message", "Đăng nhập thành công!");
        return response;
    }

    public Map<String, Object> loginWithGoogle(String tokenId) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(),
                    new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(tokenId);
            if (idToken != null) {
                Payload payload = idToken.getPayload();
                String email = payload.getEmail();
                String name = (String) payload.get("name");

                // Kiểm tra user đã tồn tại chưa
                User user = userRepository.findByEmail(email).orElse(null);
                if (user == null) {
                    // Nếu chưa có thì tạo mới
                    user = new User();
                    user.setEmail(email);
                    user.setName(name);
                    
                    Role defaultRole = roleRepository.findByName("USER")
                            .orElseThrow(() -> new RuntimeException("Lỗi: Role USER không tồn tại."));
                    user.setRole(defaultRole);
                    
                    // Người dùng Google không cần password cục bộ
                    user = userRepository.save(user);
                }

                // Tạo JWT token (lấy tên của Role)
                String token = jwtUtil.generateToken(user.getEmail(), user.getRole().getName());

                Map<String, Object> response = new HashMap<>();
                response.put("id", user.getId());
                response.put("name", user.getName());
                response.put("email", user.getEmail());
                response.put("role", user.getRole().getName());
                response.put("token", token);
                response.put("message", "Đăng nhập Google thành công!");
                return response;
            } else {
                throw new RuntimeException("Xác thực Google thất bại.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi xác thực Google: " + e.getMessage());
        }
    }

    @Transactional
    public Map<String, Object> forgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Xóa token cũ nếu có
            tokenRepository.findByUser(user).ifPresent(tokenRepository::delete);

            // Tạo token mới
            String tokenValue = UUID.randomUUID().toString();
            PasswordResetToken token = new PasswordResetToken();
            token.setToken(tokenValue);
            token.setUser(user);
            token.setExpiryDate(LocalDateTime.now().plusMinutes(15)); // Hết hạn sau 15 phút

            tokenRepository.save(token);

            // Gửi email thực tế
            emailService.sendResetPasswordEmail(user.getEmail(), tokenValue);
        }

        // Luôn trả về thông báo chung để bảo mật
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.");
        return response;
    }

    @Transactional
    public Map<String, Object> resetPassword(String tokenValue, String newPassword) {
        PasswordResetToken token = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new RuntimeException("Token không hợp lệ hoặc đã qua sử dụng."));

        if (token.isExpired()) {
            tokenRepository.delete(token);
            throw new RuntimeException("Link đặt lại mật khẩu đã hết hạn.");
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Xoá token sau khi dùng xong
        tokenRepository.delete(token);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Đổi mật khẩu thành công!");
        return response;
    }
}