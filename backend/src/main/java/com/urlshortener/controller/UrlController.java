package com.urlshortener.controller;

import com.urlshortener.dto.ShortUrlRequest;
import com.urlshortener.dto.ShortUrlResponse;
import com.urlshortener.service.UrlService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class UrlController {
    private final UrlService urlService;

    @GetMapping("/{shortCode:[a-zA-Z0-9]+}")
    public ResponseEntity<Void> redirect(@PathVariable String shortCode) {
        String originalUrl = urlService.getOriginalUrl(shortCode);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(originalUrl))
                .build();
    }

    @PostMapping("/api/urls")
    public ResponseEntity<ShortUrlResponse> create(@Valid @RequestBody ShortUrlRequest request, @AuthenticationPrincipal UserDetails principal) {
        String username = principal == null ? null : principal.getUsername();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(urlService.createShortUrl(request, username));
    }

    @GetMapping("/api/urls")
    public List<ShortUrlResponse> mine(@AuthenticationPrincipal UserDetails principal) {
        return urlService.getUserUrls(principal.getUsername());
    }

    @PutMapping("/api/urls/{shortCode}")
    public ShortUrlResponse update(@PathVariable String shortCode,
                                   @Valid @RequestBody ShortUrlRequest request,
                                   @AuthenticationPrincipal UserDetails principal) {
        return urlService.updateUrl(shortCode, request, principal.getUsername());
    }

    @DeleteMapping("/api/urls/{shortCode}")
    public ResponseEntity<Void> delete(@PathVariable String shortCode,
                                       @AuthenticationPrincipal UserDetails principal) {
        urlService.deleteUrl(shortCode, principal.getUsername());
        return ResponseEntity.noContent().build();
    }
}
