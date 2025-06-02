package com.gopisvdev.url_shortener.controller;

import com.gopisvdev.url_shortener.dto.ShortUrlDto;
import com.gopisvdev.url_shortener.dto.UrlAnalyticsDto;
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

import java.nio.file.AccessDeniedException;
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

    @GetMapping("/user/urls")
    public ResponseEntity<List<ShortUrlDto>> getUserUrls(Authentication authentication) {
        String username = authentication.getName();
        List<ShortUrlDto> dtoList = service.getUserUrls(username);
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/user/urls/{code}")
    public ResponseEntity<?> getUserUrl(@PathVariable String code, Authentication authentication) {

        String username = authentication.getName();
        ShortUrl shortUrl = service.getByCode(code);

        if (!shortUrl.getCreatedBy().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return ResponseEntity.ok(ShortUrlDto.fromEntity(shortUrl));
    }

    @GetMapping("/user/urls/{code}/stats")
    public ResponseEntity<UrlAnalyticsDto> getStatsForUrl(@PathVariable String code, Authentication authentication) throws AccessDeniedException {
        String username = authentication.getName();
        UrlAnalyticsDto stats = service.getStatsForUrl(code, username);

        return ResponseEntity.ok(stats);
    }

    @PutMapping("/user/urls/{code}")
    public ResponseEntity<?> updateUrl(@PathVariable String code, @RequestBody UrlRequest request, Authentication authentication) {
        ShortUrlDto dto = service.updateUrl(code, request, authentication);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/user/urls/{code}")
    public ResponseEntity<?> deleteUrl(@PathVariable String code, Authentication authentication) {
        ShortUrl existing = service.getByCode(code);
        if (existing == null) {
            throw new ShortUrlNotFoundException("URL NOT FOUND");
        }

        String username = authentication.getName();
        if (!existing.getCreatedBy().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to delete this URL");
        }

        service.delete(code);
        return ResponseEntity.ok("Deleted");
    }
}
