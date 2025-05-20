package com.gopisvdev.url_shortener.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ClickLogDto {
    private String ip;
    private LocalDateTime clickedAt;
    private String country;
    private String region;
    private String city;
    private String deviceType;

}
