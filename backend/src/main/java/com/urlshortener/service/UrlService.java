package com.urlshortener.service;

import com.urlshortener.dto.ShortUrlRequest;
import com.urlshortener.dto.ShortUrlResponse;
import com.urlshortener.entity.ShortUrl;
import com.urlshortener.entity.User;
import com.urlshortener.repository.ShortUrlRepository;
import com.urlshortener.repository.UserRepository;
import com.urlshortener.util.Base62Encoder;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UrlService {
    private final ShortUrlRepository shortUrlRepository;
    private final UserRepository userRepository;
    private final Base62Encoder base62Encoder;

    @Value("${app.base-url}")
    private String baseUrl;

    public ShortUrlResponse createShortUrl(ShortUrlRequest request, String username) {
        if (!isValidUrl(request.getOriginalUrl())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid URL format");
        }

        User owner = null;
        
        if (username != null) {
            owner = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        }

        for (int i = 0; i < 5; i++) {
            try {
                ShortUrl saved = shortUrlRepository.saveAndFlush(ShortUrl.builder()
                        .originalUrl(request.getOriginalUrl())
                        .shortCode(base62Encoder.generateRandomCode(7))
                        .expirationDate(request.getExpirationDate())
                        .createdBy(owner)
                        .build());
                return mapToResponse(saved);
            } catch (DataIntegrityViolationException e) {
                // short code collision, try another
            }
        }

        throw new IllegalStateException("Could not generate a unique short code");
    }

    @Transactional(readOnly = true)
    public String getOriginalUrl(String shortCode) {
        ShortUrl url = shortUrlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Short URL not found"));

        if (url.getExpirationDate() != null && url.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Short URL has expired");
        }

        return url.getOriginalUrl();
    }

    @Transactional(readOnly = true)
    public List<ShortUrlResponse> getUserUrls(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        return shortUrlRepository.findAllByCreatedBy(user)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public ShortUrlResponse updateUrl(String shortCode, ShortUrlRequest request, String username) {
        ShortUrl existing = findOwned(shortCode, username);

        if (!isValidUrl(request.getOriginalUrl())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid URL format");
        }

        existing.setOriginalUrl(request.getOriginalUrl());

        if (request.getExpirationDate() != null) {
            existing.setExpirationDate(request.getExpirationDate());
        }

        return mapToResponse(shortUrlRepository.save(existing));
    }

    private ShortUrl findOwned(String shortCode, String username) {
        ShortUrl url = shortUrlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Short URL not found"));

        User owner = url.getCreatedBy();

        if (owner == null || !owner.getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your URL");
        }
        return url;
    }

    @Transactional
    public void deleteUrl(String shortCode, String username) {
        shortUrlRepository.delete(findOwned(shortCode, username));
    }

    private boolean isValidUrl(String url) {
        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme();
            String host = uri.getHost();

            return scheme != null &&
                    (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))
                    && uri.getUserInfo() == null
                    && host != null
                    && host.matches("^[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
        } catch (URISyntaxException e) {
            return false;
        }
    }

    private ShortUrlResponse mapToResponse(ShortUrl entity) {
        return ShortUrlResponse.builder()
                .id(entity.getId())
                .shortCode(entity.getShortCode())
                .shortUrl(baseUrl + "/" + entity.getShortCode())
                .originalUrl(entity.getOriginalUrl())
                .expirationDate(entity.getExpirationDate())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
