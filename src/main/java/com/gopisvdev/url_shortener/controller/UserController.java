package com.gopisvdev.url_shortener.controller;

import com.gopisvdev.url_shortener.dto.LoginRequest;
import com.gopisvdev.url_shortener.dto.RegisterRequest;
import com.gopisvdev.url_shortener.service.JwtService;
import com.gopisvdev.url_shortener.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class UserController {
    @Autowired
    public UserService service;

    @Autowired
    AuthenticationManager manager;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid RegisterRequest request) {
        service.registerUser(request);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "User registered successfully");
        response.put("timestamp", Instant.now());
        response.put("status", HttpStatus.CREATED.value());

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        Authentication authentication = manager.authenticate(new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        if (authentication.isAuthenticated()) {
            String token = jwtService.generateToken(request.getUsername());
            return ResponseEntity.ok(token);
        } else return new ResponseEntity<>("Invalid Login", HttpStatus.BAD_REQUEST);
    }
}
