package com.gopisvdev.url_shortener.service;

import com.gopisvdev.url_shortener.dto.ShortUrlDto;
import com.gopisvdev.url_shortener.entity.ShortUrl;
import com.gopisvdev.url_shortener.entity.User;
import com.gopisvdev.url_shortener.exception.ShortUrlNotFoundException;
import com.gopisvdev.url_shortener.repository.ShortUrlRepository;
import com.gopisvdev.url_shortener.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class UrlService {

    @Autowired
    public ShortUrlRepository repository;

    @Autowired
    public UserRepository userRepository;

    private final String Base62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private final int CODE_LENGTH = 6;

    public ShortUrl createShortUrl(String originalUrl, String customCode, LocalDateTime expirationDate) {
        String code = (customCode != null && !customCode.isEmpty()) ? customCode : generateCode();

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
}
