package com.gopisvdev.url_shortener.dto;

import com.gopisvdev.url_shortener.entity.ShortUrl;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShortUrlDto {
    private Long id;
    private String originalUrl;
    private String shortCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ShortUrlDto(ShortUrl shortUrl) {
        this.id = shortUrl.getId();
        this.originalUrl = shortUrl.getOriginalUrl();
        this.shortCode = shortUrl.getShortCode();
        this.createdAt = shortUrl.getCreatedAt();
        this.updatedAt = shortUrl.getUpdatedAt();
    }

    public static ShortUrlDto fromEntity(ShortUrl entity) {
        ShortUrlDto dto = new ShortUrlDto();
        dto.setId(entity.getId());
        dto.setShortCode(entity.getShortCode());
        dto.setOriginalUrl(entity.getOriginalUrl());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        return dto;
    }
}
