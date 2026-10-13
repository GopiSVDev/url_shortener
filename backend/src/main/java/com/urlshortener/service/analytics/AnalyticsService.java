package com.urlshortener.service.analytics;

import com.urlshortener.dto.analytics.LinkAnalyticsResponse;
import com.urlshortener.dto.analytics.LinkAnalyticsResponse.DailyClicks;
import com.urlshortener.dto.analytics.LinkAnalyticsResponse.NamedCount;
import com.urlshortener.entity.ShortUrl;
import com.urlshortener.service.UrlService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {
    private static final int TOP_N = 10;

    private static final String SUMMARY = """
            select coalesce(st.click_count, 0), st.last_clicked_at, p.period_clicks, p.unique_visitors, p.bot_clicks
            from (select count(*) filter (where not bot) as period_clicks,
                         count(distinct visitor_hash) filter (where not bot) as unique_visitors,
                         count(*) filter (where bot) as bot_clicks
                  from clicks where short_url_id = ? and clicked_at >= ?) p
            left join link_stats st on st.short_url_id = ?
            """;

    private static final String CLICKS_PER_DAY = """
            select cast(clicked_at as date), count(*) from clicks
            where short_url_id = ? and not bot and clicked_at >= ?
            group by 1
            """;

    // %s is one of the fixed column expressions in Dimension
    private static final String TOP_VALUES = """
            select %s, count(*) from clicks
            where short_url_id = ? and not bot and clicked_at >= ?
            group by 1 order by 2 desc, 1 limit ?
            """;

    private enum Dimension {
        REFERRER("coalesce(referrer_host, 'Direct')"),
        BROWSER("browser"),
        OS("os"),
        DEVICE("device");

        private final String column;

        Dimension(String column) {
            this.column = column;
        }
    }

    private final UrlService urlService;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public LinkAnalyticsResponse getAnalytics(String shortCode, String username, int days) {
        ShortUrl url = urlService.findOwned(shortCode, username);
        long id = url.getId();
        LocalDate today = LocalDate.now();
        LocalDate firstDay = today.minusDays(days - 1L);
        LocalDateTime since = firstDay.atStartOfDay();

        Summary summary = jdbcTemplate.queryForObject(SUMMARY, (rs, rowNum) -> new Summary(
                        rs.getLong(1), rs.getLong(3), rs.getLong(4), rs.getLong(5),
                        rs.getObject(2, LocalDateTime.class)),
                id, since, id);

        return new LinkAnalyticsResponse(
                url.getShortCode(),
                url.getOriginalUrl(),
                days,
                summary.totalClicks(),
                summary.periodClicks(),
                summary.uniqueVisitors(),
                summary.botClicks(),
                summary.lastClickedAt(),
                clicksPerDay(id, firstDay, today),
                top(Dimension.REFERRER, id, since),
                top(Dimension.BROWSER, id, since),
                top(Dimension.OS, id, since),
                top(Dimension.DEVICE, id, since));
    }

    private record Summary(long totalClicks, long periodClicks, long uniqueVisitors, long botClicks,
                           LocalDateTime lastClickedAt) {
    }

    // One entry per day, including days without clicks, so the chart has no gaps
    private List<DailyClicks> clicksPerDay(long id, LocalDate firstDay, LocalDate today) {
        Map<LocalDate, Long> counts = new HashMap<>();

        jdbcTemplate.query(CLICKS_PER_DAY,
                (RowCallbackHandler) rs -> counts.put(rs.getObject(1, LocalDate.class), rs.getLong(2)),
                id, firstDay.atStartOfDay());

        List<DailyClicks> days = new ArrayList<>();

        for (LocalDate day = firstDay; !day.isAfter(today); day = day.plusDays(1)) {
            days.add(new DailyClicks(day, counts.getOrDefault(day, 0L)));
        }
        
        return days;
    }

    private List<NamedCount> top(Dimension dimension, long id, LocalDateTime since) {
        return jdbcTemplate.query(TOP_VALUES.formatted(dimension.column),
                (rs, rowNum) -> new NamedCount(rs.getString(1), rs.getLong(2)),
                id, since, TOP_N);
    }
}
