package com.carcarehome.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.carcarehome.backend.service.UserService;
import com.carcarehome.backend.entity.User;
import com.carcarehome.backend.dto.UserUpdateRequest;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private com.carcarehome.backend.repository.IUserRepository userRepository;
    
    @Autowired
    private com.carcarehome.backend.repository.LeaveRequestRepository leaveRequestRepository;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        java.util.List<Map<String, Object>> users = userRepository.findAll().stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getName());
            map.put("email", u.getEmail());
            map.put("role", Map.of("name", u.getRole() != null ? u.getRole().getName() : "UNKNOWN"));
            return map;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/staff/available")
    public ResponseEntity<?> getAvailableStaff() {
        java.time.LocalDate today = java.time.LocalDate.now();
        java.util.List<Map<String, Object>> availableStaff = userRepository.findAll().stream()
            .filter(u -> u.getRole() != null && ("STAFF".equals(u.getRole().getName()) || "ROLE_STAFF".equals(u.getRole().getName())))
            .filter(u -> leaveRequestRepository.countActiveLeavesForStaff(u.getId(), today) == 0)
            .map(u -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", u.getId());
                map.put("name", u.getName());
                map.put("email", u.getEmail());
                map.put("role", Map.of("name", u.getRole().getName()));
                return map;
            }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(availableStaff);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByEmail(email)
                .map(user -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("id", user.getId());
                    response.put("name", user.getName());
                    response.put("email", user.getEmail());
                    response.put("phone", user.getPhone());
                    response.put("avatar", user.getAvatar());
                    response.put("role", user.getRole().getName());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UserUpdateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            User updatedUser = userService.updateProfile(email, request);
            Map<String, Object> response = new HashMap<>();
            response.put("id", updatedUser.getId());
            response.put("name", updatedUser.getName());
            response.put("email", updatedUser.getEmail());
            response.put("phone", updatedUser.getPhone());
            response.put("avatar", updatedUser.getAvatar());
            response.put("role", updatedUser.getRole().getName());
            response.put("message", "Cập nhật hồ sơ thành công!");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/profile/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng chọn file."));
            }

            // Tạo thư mục uploads nếu chưa có
            Path uploadPath = Paths.get("uploads");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 1. Tìm user hiện tại
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

            // 2. Xóa ảnh cũ nếu có
            if (user.getAvatar() != null && user.getAvatar().startsWith("/uploads/")) {
                try {
                    String oldFilename = user.getAvatar().replace("/uploads/", "");
                    Path oldPath = uploadPath.resolve(oldFilename);
                    Files.deleteIfExists(oldPath);
                } catch (IOException e) {
                    System.err.println("Không thể xóa ảnh cũ: " + e.getMessage());
                }
            }

            // 3. Lưu file mới
            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

            // 4. Cập nhật vào DB
            String avatarUrl = "/uploads/" + filename;
            user.setAvatar(avatarUrl);
            userService.save(user);

            return ResponseEntity.ok(Map.of("avatar", avatarUrl, "message", "Tải ảnh lên thành công!"));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi khi tải ảnh: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String roleName = request.get("role");
            if (roleName == null || roleName.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vai trò không hợp lệ"));
            }
            userService.updateRole(id, roleName);
            return ResponseEntity.ok(Map.of("message", "Cập nhật quyền thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "Xóa tài khoản thành công"));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(409).body(Map.of("message", "Không thể xóa tài khoản này vì họ đang có dữ liệu công việc/lịch hẹn liên kết."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
