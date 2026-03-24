package com.carcarehome.backend.service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.carcarehome.backend.repository.IUserRepository;
import com.carcarehome.backend.entity.User;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private IUserRepository userRepository;

    public List<User> getAllUsers(){
        return userRepository.findAll();
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User save(User user){
        return userRepository.save(user);
    }

    public User updateProfile(String email, com.carcarehome.backend.dto.UserUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
        
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        
        return userRepository.save(user);
    }

    @Autowired
    private com.carcarehome.backend.repository.IRoleRepository roleRepository;

    public User updateRole(Long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
        com.carcarehome.backend.entity.Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> {
                    com.carcarehome.backend.entity.Role newRole = new com.carcarehome.backend.entity.Role();
                    newRole.setName(roleName);
                    return roleRepository.save(newRole);
                });
        user.setRole(role);
        return userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }
}