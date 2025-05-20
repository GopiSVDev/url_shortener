package com.gopisvdev.url_shortener.controller;

import com.gopisvdev.url_shortener.dto.ShortUrlDto;
import com.gopisvdev.url_shortener.dto.UrlRequest;
import com.gopisvdev.url_shortener.entity.ShortUrl;
import com.gopisvdev.url_shortener.exception.ShortUrlNotFoundException;
import com.gopisvdev.url_shortener.service.RateLimiterService;
import com.gopisvdev.url_shortener.service.UrlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class UrlController {
    @Autowired
    private UrlService service;

    @Autowired
    private RateLimiterService rateLimiterService;

    @PostMapping("/shorten")
    public ResponseEntity<?> createUrl(@RequestBody UrlRequest request) {
        try {
            ShortUrl shortUrl = service.createShortUrl(request.getOriginalUrl(), request.getCustomCode(), request.getExpirationDate());
            return ResponseEntity.ok(shortUrl);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @GetMapping("/shorten/{code}")
    public ResponseEntity<?> getUrl(@PathVariable String code) {
        try {
            ShortUrl shortUrl = service.getByCode(code);

            ShortUrlDto dto = new ShortUrlDto(shortUrl);
            return ResponseEntity.ok(dto);
        } catch (ShortUrlNotFoundException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Short URL not found");
        }
    }


    @PutMapping("/shorten/{code}")
    public ResponseEntity<?> updateUrl(@PathVariable String code, @RequestBody UrlRequest request) {
        ShortUrl existing = service.getByCode(code);
        if (existing == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        existing.setOriginalUrl(request.getOriginalUrl());
        existing.setUpdatedAt(LocalDateTime.now());

        if (request.getExpirationDate() != null) {
            existing.setExpirationDate(request.getExpirationDate());
        }

        service.save(existing);
        ShortUrlDto dto = new ShortUrlDto(existing);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/shorten/{code}")
    public ResponseEntity<?> deleteUrl(@PathVariable String code) {
        ShortUrl existing = service.getByCode(code);
        if (existing == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        service.delete(code);
        return ResponseEntity.ok("Deleted");
    }


    @GetMapping("/user/urls")
    public ResponseEntity<List<ShortUrlDto>> getUserUrls(Authentication authentication) {
        String username = authentication.getName();
        List<ShortUrlDto> dtoList = service.getUserUrls(username);
        return ResponseEntity.ok(dtoList);
    }
}
