package com.gopisvdev.url_shortener.service;

import com.gopisvdev.url_shortener.dto.ClickLogDto;
import com.gopisvdev.url_shortener.dto.ShortUrlStatsDto;
import com.gopisvdev.url_shortener.entity.ShortUrl;
import com.gopisvdev.url_shortener.exception.ShortUrlNotFoundException;
import com.gopisvdev.url_shortener.repository.ShortUrlRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class UrlService {

    @Autowired
    public ShortUrlRepository repository;

    private final String Base62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private final int CODE_LENGTH = 6;

    public ShortUrl createShortUrl(String originalUrl, String customCode, LocalDateTime expirationDate) {
        String code = (customCode != null && !customCode.isEmpty()) ? customCode : generateCode();

        if (repository.existsByShortCode(code)) {
            throw new IllegalArgumentException("Short code already exists.");
        }

        ShortUrl url = new ShortUrl();
        url.setShortCode(code);
        url.setOriginalUrl(originalUrl);
        url.setExpirationDate(expirationDate);
        url.setCreatedAt(LocalDateTime.now());

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

    public ShortUrlStatsDto mapToStatsDto(ShortUrl shortUrl) {
        ShortUrlStatsDto dto = new ShortUrlStatsDto();
        dto.setOriginalUrl(shortUrl.getOriginalUrl());
        dto.setShortCode(shortUrl.getShortCode());
        dto.setClickCount(shortUrl.getClickCount());
        dto.setCreatedAt(shortUrl.getCreatedAt());
        dto.setUpdatedAt(shortUrl.getUpdatedAt());
        dto.setExpirationDate(shortUrl.getExpirationDate());

        List<ClickLogDto> logs = shortUrl.getClickLogs().stream().map(log -> {
            ClickLogDto logDto = new ClickLogDto();
            logDto.setIp(log.getIp());
            logDto.setClickedAt(log.getClickedAt());
            logDto.setCountry(log.getCountry());
            logDto.setRegion(log.getRegion());
            logDto.setCity(log.getCity());
            logDto.setDeviceType(log.getDeviceType());
            return logDto;
        }).toList();

        dto.setClickLogs(logs);
        return dto;
    }
}
