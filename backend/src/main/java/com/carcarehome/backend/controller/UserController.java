package com.carcarehome.backend.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.carcarehome.backend.dto.UserUpdateRequest;
import com.carcarehome.backend.entity.User;
import com.carcarehome.backend.repository.IUserRepository;
import com.carcarehome.backend.repository.LeaveRequestRepository;
import com.carcarehome.backend.service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        List<Map<String, Object>> users = userRepository.findAll().stream()
                .map(user -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", user.getId());
                    map.put("name", user.getName());
                    map.put("email", user.getEmail());
                    map.put("role", Map.of("name", user.getRole() != null ? user.getRole().getName() : "UNKNOWN"));
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/staff/available")
    public ResponseEntity<?> getAvailableStaff() {
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> availableStaff = userRepository.findAll().stream()
                .filter(user -> user.getRole() != null
                        && ("STAFF".equals(user.getRole().getName()) || "ROLE_STAFF".equals(user.getRole().getName())))
                .filter(user -> leaveRequestRepository.countActiveLeavesForStaff(user.getId(), today) == 0)
                .map(user -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", user.getId());
                    map.put("name", user.getName());
                    map.put("email", user.getEmail());
                    map.put("role", Map.of("name", user.getRole().getName()));
                    return map;
                })
                .collect(Collectors.toList());
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

            Path uploadPath = Paths.get("uploads");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

            if (user.getAvatar() != null && user.getAvatar().startsWith("/uploads/")) {
                try {
                    String oldFilename = user.getAvatar().replace("/uploads/", "");
                    Path oldPath = uploadPath.resolve(oldFilename);
                    Files.deleteIfExists(oldPath);
                } catch (IOException e) {
                    System.err.println("Không thể xóa ảnh cũ: " + e.getMessage());
                }
            }

            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

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
            if (roleName == null || roleName.isBlank()) {
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
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(409).body(Map.of(
                    "message",
                    "Không thể xóa tài khoản này vì họ đang có dữ liệu công việc/lịch hẹn liên kết."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
