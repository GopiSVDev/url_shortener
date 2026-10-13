package com.urlshortener.dto.analytics;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// Stats for one link. "Period" values cover the last `days` days (today included); bot clicks are excluded
// everywhere except botClicks.
public record LinkAnalyticsResponse(
        String shortCode,
        String originalUrl,
        int days,
        long totalClicks,
        long periodClicks,
        long uniqueVisitors,
        long botClicks,
        LocalDateTime lastClickedAt,
        List<DailyClicks> clicksPerDay,
        List<NamedCount> referrers,
        List<NamedCount> browsers,
        List<NamedCount> operatingSystems,
        List<NamedCount> devices
) {
    public record DailyClicks(LocalDate date, long clicks) {
    }

    public record NamedCount(String name, long clicks) {
    }
}
