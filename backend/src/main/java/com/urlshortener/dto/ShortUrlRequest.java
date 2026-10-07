package com.urlshortener.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShortUrlRequest {
    private static final java.util.regex.Pattern HAS_SCHEME =
            java.util.regex.Pattern.compile("^[a-zA-Z][a-zA-Z0-9+.-]*://.*");

    @NotBlank(message = "Original URL cannot be empty")
    @URL(message = "Invalid URL format")
    @Pattern(regexp = "(?i)^https?://.+", message = "URL must start with http:// or https://")
    private String originalUrl;

    @Future(message = "Expiration date must be in the future")
    private LocalDateTime expirationDate;

    public void setOriginalUrl(String originalUrl) {
        if (originalUrl == null) {
            this.originalUrl = null;
            return;
        }
        String trimmed = originalUrl.trim();
        this.originalUrl = (trimmed.isEmpty() || HAS_SCHEME.matcher(trimmed).matches())
                ? trimmed
                : "https://" + trimmed;
    }
}
