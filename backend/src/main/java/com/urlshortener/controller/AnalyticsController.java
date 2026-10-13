package com.urlshortener.controller;

import com.urlshortener.dto.analytics.LinkAnalyticsResponse;
import com.urlshortener.service.analytics.AnalyticsService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    @GetMapping("/api/urls/{shortCode}/analytics")
    public LinkAnalyticsResponse analytics(@PathVariable String shortCode,
            @RequestParam(defaultValue = "30") @Min(1) @Max(365) int days,
            @AuthenticationPrincipal UserDetails principal) {
        return analyticsService.getAnalytics(shortCode, principal.getUsername(), days);
    }
}
