package com.urlshortener.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShortUrlRequest {
    private static final java.util.regex.Pattern HAS_SCHEME =
            java.util.regex.Pattern.compile("^[a-zA-Z][a-zA-Z0-9+.-]*://.*");

    private String originalUrl;

    @Future(message = "Expiration date must be in the future")
    private LocalDateTime expirationDate;

    @NotBlank(message = "Original URL cannot be empty")
    @Size(max = 2048, message = "URL is too long")
    @Pattern(regexp = "(?i)^https?://.+", message = "URL must start with http:// or https://")
    public String getOriginalUrl() {
        if (originalUrl == null) return null;
        String trimmed = originalUrl.trim();
        return (trimmed.isEmpty() || HAS_SCHEME.matcher(trimmed).matches())
                ? trimmed
                : "https://" + trimmed;
    }
}
