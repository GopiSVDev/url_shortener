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
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UrlService {
    private static final String COUNT_CLICKS_PER_LINK = """
            select st.short_url_id, st.click_count from link_stats st
            join short_urls s on s.id = st.short_url_id
            where s.user_id = ?
            """;

    private static final Set<String> RESERVED_ALIASES = Set.of("api", "actuator", "error");

    private final ShortUrlRepository shortUrlRepository;
    private final UserRepository userRepository;
    private final Base62Encoder base62Encoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.base-url}")
    private String baseUrl;

    @Transactional
    public ShortUrlResponse createShortUrl(ShortUrlRequest request, String username) {
        if (!isValidUrl(request.getOriginalUrl())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid URL format");
        }

        User owner = null;

        if (username != null) {
            owner = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        }

        String shortCode = request.getAlias();

        if (shortCode != null) {
            if (RESERVED_ALIASES.contains(shortCode.toLowerCase(Locale.ROOT))
                    || shortUrlRepository.existsByShortCode(shortCode)) {
                throw aliasTaken();
            }
        } else {
            do {
                shortCode = base62Encoder.generateRandomCode(7);
            } while (shortUrlRepository.existsByShortCode(shortCode));
        }

        ShortUrl shortUrl = ShortUrl.builder()
                .originalUrl(request.getOriginalUrl())
                .shortCode(shortCode)
                .expirationDate(request.getExpirationDate())
                .createdBy(owner)
                .build();

        return mapToResponse(shortUrlRepository.save(shortUrl));
    }

    private static ResponseStatusException aliasTaken() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "This alias is already taken");
    }

    // Returns the link to redirect to: its id (for click recording) and its original URL
    @Transactional(readOnly = true)
    public RedirectTarget getRedirectTarget(String shortCode) {
        ShortUrl url = shortUrlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Short URL not found"));

        if (url.getExpirationDate() != null && url.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Short URL has expired");
        }

        return new RedirectTarget(url.getId(), url.getOriginalUrl());
    }

    public record RedirectTarget(long id, String originalUrl) {
    }

    @Transactional(readOnly = true)
    public List<ShortUrlResponse> getUserUrls(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        Map<Long, Long> clickCounts = new HashMap<>();

        jdbcTemplate.query(COUNT_CLICKS_PER_LINK,
                (RowCallbackHandler) rs -> clickCounts.put(rs.getLong(1), rs.getLong(2)), user.getId());

        return shortUrlRepository.findAllByCreatedByOrderByCreatedAtDesc(user)
                .stream()
                .map(url -> {
                    ShortUrlResponse response = mapToResponse(url);
                    response.setClickCount(clickCounts.getOrDefault(url.getId(), 0L));
                    return response;
                })
                .toList();
    }

    @Transactional
    public ShortUrlResponse updateUrl(String shortCode, ShortUrlRequest request, String username) {
        ShortUrl existing = findOwned(shortCode, username);

        if (!isValidUrl(request.getOriginalUrl())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid URL format");
        }

        existing.setOriginalUrl(request.getOriginalUrl());
        existing.setExpirationDate(request.getExpirationDate());

        return mapToResponse(shortUrlRepository.save(existing));
    }

    // Call inside a transaction: reads the lazy owner
    public ShortUrl findOwned(String shortCode, String username) {
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
