package com.gopisvdev.url_shortener.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UrlRequest {
    private String originalUrl;
    private String customCode;
    private LocalDateTime expirationDate;
}
