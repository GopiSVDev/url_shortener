package com.gopisvdev.url_shortener.controller;

import com.gopisvdev.url_shortener.entity.ShortUrl;
import com.gopisvdev.url_shortener.exception.ShortUrlNotFoundException;
import com.gopisvdev.url_shortener.service.RateLimiterService;
import com.gopisvdev.url_shortener.service.RedirectService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequiredArgsConstructor
public class RedirectController {
    @Autowired
    private final RedirectService redirectService;

    @Autowired
    private RateLimiterService rateLimiterService;

    @GetMapping("/{code}")
    public ResponseEntity<?> redirect(@PathVariable String code, HttpServletRequest request) {
        String ip = rateLimiterService.getClientIp(request);
        ShortUrl shortUrl;
        try {
            if (rateLimiterService.shouldCountClick(ip, code)) {
                shortUrl = redirectService.incrementClickAndGet(code);
                redirectService.logClick(shortUrl, request, ip);
            } else {
                shortUrl = redirectService.getByCode(code);
            }

            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(shortUrl.getOriginalUrl()))
                    .build();
            
        } catch (ShortUrlNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Short URL not found");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.GONE).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal error");
        }
    }
}
