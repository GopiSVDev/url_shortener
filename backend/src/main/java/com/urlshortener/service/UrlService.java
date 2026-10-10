package com.urlshortener.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.urlshortener.dto.ShortUrlRequest;
import com.urlshortener.dto.ShortUrlResponse;
import com.urlshortener.entity.ShortUrl;
import com.urlshortener.entity.User;
import com.urlshortener.repository.ShortUrlRepository;
import com.urlshortener.repository.UserRepository;
import com.urlshortener.util.Base62Encoder;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlParameterValue;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URISyntaxException;
import java.sql.Types;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UrlService {
    private static final String INSERT_SHORT_URL = """
            insert into short_urls (original_url, short_code, expiration_date, created_at, updated_at, user_id)
            values (?, ?, ?, ?, ?, ?)
            returning id
            """;
    private static final String SELECT_REDIRECT_TARGET = """
            select original_url, expiration_date from short_urls where short_code = ?
            """;

    private final ShortUrlRepository shortUrlRepository;
    private final UserRepository userRepository;
    private final Base62Encoder base62Encoder;
    private final JdbcTemplate jdbcTemplate;

    // Redirect targets in memory: the backend CPU is the limit, so an in-process cache beats a network hop
    // to Redis. 100k entries hold the hot links of the Zipf traffic; unknown codes are cached as NOT_FOUND.
    // Entries are evicted on create/update/delete; the TTL bounds staleness from changes made outside the app.
    private final Cache<String, RedirectTarget> redirectCache = Caffeine.newBuilder()
            .maximumSize(100_000)
            .expireAfterWrite(Duration.ofMinutes(10))
            .build();

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

        Long ownerId = owner == null ? null : owner.getId();

        for (int i = 0; i < 5; i++) {
            String shortCode = base62Encoder.generateRandomCode(7);
            LocalDateTime now = LocalDateTime.now();
            try {
                Long id = jdbcTemplate.queryForObject(INSERT_SHORT_URL,
                        Long.class, request.getOriginalUrl(), shortCode,
                        new SqlParameterValue(Types.TIMESTAMP, request.getExpirationDate()),
                        now, now,
                        new SqlParameterValue(Types.BIGINT, ownerId));

                // the code may be cached as NOT_FOUND from an earlier request (autocommit: already committed)
                redirectCache.invalidate(shortCode);

                return ShortUrlResponse.builder()
                        .id(id)
                        .shortCode(shortCode)
                        .shortUrl(baseUrl + "/" + shortCode)
                        .originalUrl(request.getOriginalUrl())
                        .expirationDate(request.getExpirationDate())
                        .createdAt(now)
                        .build();

            } catch (DuplicateKeyException e) {
                // short code collision, try another
            }
        }
        
        throw new IllegalStateException("Could not generate a unique short code");
    }

    public String getOriginalUrl(String shortCode) {
        RedirectTarget target = redirectCache.get(shortCode, this::loadRedirectTarget);

        if (target == RedirectTarget.NOT_FOUND) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Short URL not found");
        }

        // checked on every hit, so a link that expires while cached returns 410 right away
        if (target.expirationDate() != null && target.expirationDate().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Short URL has expired");
        }

        return target.originalUrl();
    }

    // Plain JDBC in autocommit: one round trip (no BEGIN READ ONLY), only the two columns a redirect needs
    private RedirectTarget loadRedirectTarget(String shortCode) {
        List<RedirectTarget> rows = jdbcTemplate.query(SELECT_REDIRECT_TARGET,
                (rs, rowNum) -> new RedirectTarget(rs.getString(1), rs.getObject(2, LocalDateTime.class)),
                shortCode);

        return rows.isEmpty() ? RedirectTarget.NOT_FOUND : rows.getFirst();
    }

    // After commit, so a concurrent redirect can't reload the old row into the cache before the change lands
    private void evictAfterCommit(String shortCode) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                redirectCache.invalidate(shortCode);
            }
        });
    }

    private record RedirectTarget(String originalUrl, LocalDateTime expirationDate) {
        static final RedirectTarget NOT_FOUND = new RedirectTarget(null, null);
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

        evictAfterCommit(shortCode);
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
        evictAfterCommit(shortCode);
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
