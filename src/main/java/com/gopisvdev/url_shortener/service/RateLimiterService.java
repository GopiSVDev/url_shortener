package com.gopisvdev.url_shortener.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {
    private final Map<String, LocalDateTime> accessMap = new ConcurrentHashMap<>();
    private final long WINDOW_MINUTES = 5;

    public boolean shouldCountClick(String ip, String code) {
        String key = ip + ":" + code;
        LocalDateTime lastAccess = accessMap.get(key);

        if (lastAccess == null || lastAccess.plusMinutes(WINDOW_MINUTES).isBefore(LocalDateTime.now())) {
            accessMap.put(key, LocalDateTime.now());
            return true;
        }
        return false;
    }

    public String getClientIp(HttpServletRequest request) {
        String header = request.getHeader("X-Forwarded-For");
        if (header != null && !header.isEmpty() && !"unknown".equalsIgnoreCase(header)) {
            return header.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

}
