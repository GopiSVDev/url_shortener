package com.gopisvdev.url_shortener.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UrlAnalyticsDto {
    private Map<String, Long> clicksByDate;
    private Map<String, Long> clicksByDeviceType;
    private Map<String, Long> clicksByCity;
    private Map<String, Long> clicksByCountry;
}
