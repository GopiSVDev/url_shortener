package com.urlshortener.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

// Per-IP limits on the endpoints that are open to anonymous abuse: creating links (spam, phishing)
// and login/register (password guessing). Fixed one-minute windows, counted in memory, so the limits are
// per backend instance. The client IP comes from X-Forwarded-For when the request passed through a trusted
// proxy (server.forward-headers-strategy); the frontend forwards the browser's IP the same way.
@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private static final Duration WINDOW = Duration.ofMinutes(1);

    // "METHOD path" -> requests allowed per IP per window
    private static final Map<String, Integer> LIMITS = Map.of(
            "POST /api/urls", 30,
            "POST /api/auth/login", 10,
            "POST /api/auth/register", 10);

    private final Cache<String, AtomicInteger> counters = Caffeine.newBuilder()
            .expireAfterWrite(WINDOW)
            .maximumSize(100_000)
            .build();

    private final boolean enabled;

    public RateLimitFilter(@Value("${app.rate-limit.enabled:true}") boolean enabled) {
        this.enabled = enabled;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !enabled || !LIMITS.containsKey(rule(request));
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain chain)
            throws ServletException, IOException {

        String rule = rule(request);
        
        AtomicInteger count = counters.get(rule + " " + request.getRemoteAddr(), key -> new AtomicInteger());

        if (count.incrementAndGet() > LIMITS.get(rule)) {
            response.setStatus(429);
            response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(WINDOW.toSeconds()));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Too many requests, try again later\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    private static String rule(HttpServletRequest request) {
        return request.getMethod() + " " + request.getRequestURI();
    }
}
