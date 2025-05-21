package com.gopisvdev.url_shortener.service;

import com.gopisvdev.url_shortener.entity.ClickLog;
import com.gopisvdev.url_shortener.entity.ShortUrl;
import com.gopisvdev.url_shortener.exception.ShortUrlNotFoundException;
import com.gopisvdev.url_shortener.repository.ClickLogRepository;
import com.gopisvdev.url_shortener.repository.ShortUrlRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RedirectService {
    private final ShortUrlRepository shortUrlRepository;
    private final ClickLogRepository clickLogRepository;
    private final GeoIpService geoIpService;

    @Transactional
    public ShortUrl incrementClickAndGet(String code) {
        ShortUrl url = shortUrlRepository.findByShortCode(code)
                .orElseThrow(() -> new ShortUrlNotFoundException("Url not found"));

        if (url.getExpirationDate() != null && url.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Short URL has expired.");
        }

        url.setClickCount(url.getClickCount() + 1);
        return shortUrlRepository.save(url);
    }

    public ShortUrl getByCode(String code) {
        return shortUrlRepository.findByShortCode(code)
                .orElseThrow(() -> new ShortUrlNotFoundException("Url not found"));
    }

    public void logClick(ShortUrl url, HttpServletRequest request, String ip) {
        ClickLog clickLog = new ClickLog();
        clickLog.setShortUrl(url);
        clickLog.setClickedAt(LocalDateTime.now());
        clickLog.setIp(ip);

        var city = geoIpService.lookup(ip);
        if (city != null) {
            clickLog.setCountry(city.country());
            clickLog.setRegion(city.region());
            clickLog.setCity(city.city());
        }

        String ua = request.getHeader("User-Agent");
        clickLog.setDeviceType(detectDeviceType(ua));

        clickLogRepository.save(clickLog);
    }

    private String detectDeviceType(String userAgent) {
        if (userAgent == null) return "unknown";

        String uaLower = userAgent.toLowerCase();

        if (uaLower.contains("mobile") || uaLower.contains("android") ||
                uaLower.contains("iphone") || uaLower.contains("ipad")) {
            return "mobile";
        }

        return "desktop";
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0]; // first IP in X-Forwarded-For list
    }

}
