package com.gopisvdev.url_shortener.controller;

import com.gopisvdev.url_shortener.dto.UrlRequest;
import com.gopisvdev.url_shortener.entity.ShortUrl;
import com.gopisvdev.url_shortener.exception.ShortUrlNotFoundException;
import com.gopisvdev.url_shortener.service.RateLimiterService;
import com.gopisvdev.url_shortener.service.UrlService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;

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
            return ResponseEntity.ok(shortUrl);
        } catch (ShortUrlNotFoundException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Short URL not found");
        }
    }

    @GetMapping("/r/{code}")
    public ResponseEntity<?> redirect(@PathVariable String code, HttpServletRequest request) throws IOException {
        String ip = rateLimiterService.getClientIp(request);
        ShortUrl shortUrl;

        System.out.println(ip);

        try {
            if (rateLimiterService.shouldCountClick(ip, code)) {
                shortUrl = service.incrementClickAndGet(code);
            } else {
                shortUrl = service.getByCode(code);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setLocation(URI.create(shortUrl.getOriginalUrl()));
            return new ResponseEntity<>(headers, HttpStatus.TEMPORARY_REDIRECT);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
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
        return ResponseEntity.ok(existing);
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

    @GetMapping("/shorten/{code}/stats")
    public ResponseEntity<?> getStats(@PathVariable String code) {
        try {
            ShortUrl shortUrl = service.getByCode(code);
            return ResponseEntity.ok(shortUrl);
        } catch (ShortUrlNotFoundException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Short URL not found");
        }
    }
}
