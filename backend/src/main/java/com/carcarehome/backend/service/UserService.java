package com.carcarehome.backend.service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.carcarehome.backend.repository.IUserRepository;
import com.carcarehome.backend.entity.User;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private IUserRepository userRepository;

    public List<User> getAllUsers(){
        return userRepository.findAll();
    }

    public User save(User user){
        return userRepository.save(user);
    }
}