package com.gopisvdev.url_shortener.service;

import com.gopisvdev.url_shortener.dto.ShortUrlDto;
import com.gopisvdev.url_shortener.dto.UrlAnalyticsDto;
import com.gopisvdev.url_shortener.dto.UrlRequest;
import com.gopisvdev.url_shortener.entity.ShortUrl;
import com.gopisvdev.url_shortener.entity.User;
import com.gopisvdev.url_shortener.exception.ShortUrlNotFoundException;
import com.gopisvdev.url_shortener.repository.ClickLogRepository;
import com.gopisvdev.url_shortener.repository.ShortUrlRepository;
import com.gopisvdev.url_shortener.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.AccessDeniedException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class UrlService {

    @Autowired
    public ShortUrlRepository repository;

    @Autowired
    public UserRepository userRepository;

    @Autowired
    public ClickLogRepository clickLogRepository;

    private final String Base62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private final int CODE_LENGTH = 6;

    private static final Pattern CUSTOM_CODE_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]{3,30}$");
    private static final Set<String> RESERVED_WORDS = Set.of(
            "login", "api", "user", "register", "shorten", "qr"
    );

    public ShortUrl createShortUrl(String originalUrl, String customCode, LocalDateTime expirationDate) {
        if (!isValidUrl(originalUrl)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid URL format");
        }

        String code;
        if (customCode != null && !customCode.isEmpty()) {
            validateCustomCode(customCode);
            code = customCode;
        } else {
            code = generateCode();
        }

        if (repository.existsByShortCode(code)) {
            throw new IllegalArgumentException("Short code already exists.");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User user = userRepository.findByUsername(username).orElse(null);

        ShortUrl url = new ShortUrl();
        url.setShortCode(code);
        url.setOriginalUrl(originalUrl);
        url.setExpirationDate(expirationDate);
        url.setCreatedAt(LocalDateTime.now());
        if (user != null) url.setCreatedBy(user);

        return repository.save(url);
    }

    private boolean isValidUrl(String url) {
        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme();
            String host = uri.getHost();

            return scheme != null &&
                    (scheme.equals("http") || scheme.equals("https"))
                    && host != null
                    && host.matches("^[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
        } catch (URISyntaxException e) {
            return false;
        }
    }

    public ShortUrlDto updateUrl(String code, UrlRequest request, Authentication authentication) {
        ShortUrl existing = getByCode(code);
        if (existing == null) {
            throw new ShortUrlNotFoundException("URL NOT FOUND");
        }
        String username = authentication.getName();
        if (!existing.getCreatedBy().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to update this URL");
        }

        String customCode = request.getCustomCode();
        if (customCode != null && !customCode.equals(existing.getShortCode())) {
            if (repository.existsByShortCode(customCode)) {
                throw new IllegalArgumentException("Custom code is already in use.");
            }
            existing.setShortCode(customCode);
        }

        existing.setOriginalUrl(request.getOriginalUrl());
        existing.setUpdatedAt(LocalDateTime.now());

        if (request.getExpirationDate() != null) {
            existing.setExpirationDate(request.getExpirationDate());
        }

        save(existing);
        return new ShortUrlDto(existing);
    }

    private void validateCustomCode(String customCode) {
        if (customCode == null || customCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Custom code cannot be blank");
        }

        if (!CUSTOM_CODE_PATTERN.matcher(customCode).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Custom code must be 3-30 characters, alphanumeric or _/-");
        }

        if (RESERVED_WORDS.contains(customCode.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Custom code is reserved");
        }
    }

    public String generateCode() {
        SecureRandom random = new SecureRandom();
        StringBuilder stringBuilder = new StringBuilder(CODE_LENGTH);

        for (int i = 0; i < CODE_LENGTH; i++) {
            int index = random.nextInt(Base62.length());
            stringBuilder.append(Base62.charAt(index));
        }

        return stringBuilder.toString();
    }


    public ShortUrl getByCode(String code) {
        ShortUrl url = repository.findByShortCode(code).orElseThrow(() -> new ShortUrlNotFoundException("Url not found"));

        if (url.getExpirationDate() != null && url.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Short URL has expired.");
        }

        return url;
    }


    @Transactional
    public ShortUrl save(ShortUrl shortUrl) {
        return repository.save(shortUrl);
    }

    public void delete(String code) {
        ShortUrl url = repository.findByShortCode(code).orElseThrow(() -> new RuntimeException("Url not found"));

        repository.delete(url);
    }

    public List<ShortUrlDto> getUserUrls(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            throw new UsernameNotFoundException("User not found: " + username);
        }
        List<ShortUrl> urls = repository.findAllByCreatedBy(user);
        return urls.stream()
                .map(ShortUrlDto::fromEntity)
                .toList();
    }

    public UrlAnalyticsDto getStatsForUrl(String code, String username) throws AccessDeniedException {
        ShortUrl shortUrl = repository.findByShortCode(code).orElseThrow(() -> new ShortUrlNotFoundException("Url Not Found"));

        if (!shortUrl.getCreatedBy().getUsername().equals(username)) {
            throw new AccessDeniedException("Unauthorized Access");
        }

        List<Object[]> byDate = clickLogRepository.countClicksOverTime(shortUrl);
        List<Object[]> byDevice = clickLogRepository.countClicksByDeviceType(shortUrl);
        List<Object[]> byCity = clickLogRepository.countClicksByCity(shortUrl);
        List<Object[]> byCountry = clickLogRepository.countClicksByCountry(shortUrl);

        UrlAnalyticsDto dto = new UrlAnalyticsDto();
        dto.setClicksByCity(toMap(byCity));
        dto.setClicksByDate(toMap(byDate));
        dto.setClicksByDeviceType(toMap(byDevice));
        dto.setClicksByCountry(toMap(byCountry));

        return dto;
    }

    private Map<String, Long> toMap(List<Object[]> list) {
        return list.stream()
                .filter(obj -> obj[0] != null)
                .collect(Collectors.toMap(
                        obj -> obj[0].toString(),
                        obj -> (Long) obj[1]
                ));
    }
}
