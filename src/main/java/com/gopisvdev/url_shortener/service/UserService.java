package com.gopisvdev.url_shortener.service;

import com.gopisvdev.url_shortener.dto.RegisterRequest;
import com.gopisvdev.url_shortener.entity.User;
import com.gopisvdev.url_shortener.exception.UsernameAlreadyExistsException;
import com.gopisvdev.url_shortener.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UserService {

    private final UserRepository userRepo;

    @Autowired
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void registerUser(RegisterRequest request) {
        if (userRepo.existsByUsername(request.getUsername())) {
            throw new UsernameAlreadyExistsException("Username already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        user.setRole("USER");
        userRepo.save(user);
    }
}
