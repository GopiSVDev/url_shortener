package com.urlshortener.service.analytics;

import com.urlshortener.util.UserAgentParser;
import com.urlshortener.util.UserAgentParser.UserAgent;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.support.TransactionTemplate;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class ClickRecorder {
    private static final Logger log = LoggerFactory.getLogger(ClickRecorder.class);

    private static final int QUEUE_CAPACITY = 50_000;
    private static final int BATCH_SIZE = 1_000;
    private static final int MAX_HEADER_LENGTH = 512;
    private static final int MAX_REFERRER_HOST_LENGTH = 255;

    // The whole batch in one statement (arrays instead of one execution per row). The link may have been
    // deleted after the click; such clicks are skipped instead of failing the batch.
    private static final String INSERT_CLICKS = """
            insert into clicks (short_url_id, clicked_at, referrer_host, browser, os, device, bot, visitor_hash)
            select c.short_url_id, c.clicked_at, c.referrer_host, c.browser, c.os, c.device, c.bot, c.visitor_hash
            from unnest(?::bigint[], ?::timestamp[], ?::text[], ?::text[], ?::text[], ?::text[], ?::boolean[], ?::text[])
                as c(short_url_id, clicked_at, referrer_host, browser, os, device, bot, visitor_hash)
            where exists (select 1 from short_urls s where s.id = c.short_url_id)
            """;

    // Adds a batch's (non-bot) clicks to the link's running total
    private static final String UPSERT_LINK_STATS = """
            insert into link_stats (short_url_id, click_count, last_clicked_at)
            select ?, ?, ?
            where exists (select 1 from short_urls where id = ?)
            on conflict (short_url_id) do update
            set click_count = link_stats.click_count + excluded.click_count,
                last_clicked_at = greatest(link_stats.last_clicked_at, excluded.last_clicked_at)
            """;

    private record PendingClick(long shortUrlId, LocalDateTime clickedAt, String ip, String userAgent,
                                String referrer) {
    }

    private record ParsedClick(long shortUrlId, LocalDateTime clickedAt, String referrerHost, UserAgent agent,
                               String visitorHash) {
    }

    private record LinkTotal(long shortUrlId, long clicks, LocalDateTime lastClickedAt) {
    }

    private final BlockingQueue<PendingClick> queue = new ArrayBlockingQueue<>(QUEUE_CAPACITY);
    private final AtomicLong dropped = new AtomicLong();
    private final JdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final String visitorSalt;

    public ClickRecorder(JdbcTemplate jdbcTemplate, TransactionTemplate transactionTemplate,
                         @Value("${app.analytics.visitor-salt}") String visitorSalt) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.visitorSalt = visitorSalt;
    }

    // Called on the redirect path: must stay cheap and never throw
    public void record(long shortUrlId, String ip, String userAgent, String referrer) {
        PendingClick click = new PendingClick(shortUrlId, LocalDateTime.now(), ip,
                truncate(userAgent, MAX_HEADER_LENGTH), truncate(referrer, MAX_HEADER_LENGTH));

        if (!queue.offer(click)) {
            dropped.incrementAndGet();
        }
    }

    @Scheduled(fixedDelay = 1_000)
    public void flush() {
        long droppedNow = dropped.getAndSet(0);

        if (droppedNow > 0) {
            log.warn("Click queue full: dropped {} clicks", droppedNow);
        }

        List<PendingClick> batch = new ArrayList<>(BATCH_SIZE);
        while (queue.drainTo(batch, BATCH_SIZE) > 0) {
            insert(batch);
            batch.clear();
        }
    }

    @PreDestroy
    void flushOnShutdown() {
        flush();
    }

    // Clicks and totals in one transaction, so the totals can't drift from the clicks
    private void insert(List<PendingClick> batch) {
        List<ParsedClick> clicks = batch.stream().map(this::parse).toList();
        List<LinkTotal> totals = totals(clicks);

        try {
            transactionTemplate.executeWithoutResult(status -> {
                jdbcTemplate.update(con -> insertClicks(con, clicks));

                jdbcTemplate.batchUpdate(UPSERT_LINK_STATS, totals, totals.size(), (ps, total) -> {
                    ps.setLong(1, total.shortUrlId());
                    ps.setLong(2, total.clicks());
                    ps.setObject(3, total.lastClickedAt());
                    ps.setLong(4, total.shortUrlId());
                });
            });
        } catch (DataAccessException | TransactionException e) {
            // Analytics must never break the app; losing a batch is logged instead
            log.warn("Could not save {} clicks", batch.size(), e);
        }
    }

    private static PreparedStatement insertClicks(Connection con, List<ParsedClick> clicks) throws SQLException {
        int n = clicks.size();
        Long[] shortUrlIds = new Long[n];
        String[] clickedAts = new String[n];
        String[] referrerHosts = new String[n];
        String[] browsers = new String[n];
        String[] oses = new String[n];
        String[] devices = new String[n];
        Boolean[] bots = new Boolean[n];
        String[] visitorHashes = new String[n];

        // Timestamps go as ISO text and are cast to timestamp[] in SQL
        for (int i = 0; i < n; i++) {
            ParsedClick click = clicks.get(i);
            shortUrlIds[i] = click.shortUrlId();
            clickedAts[i] = click.clickedAt().toString();
            referrerHosts[i] = click.referrerHost();
            browsers[i] = click.agent().browser();
            oses[i] = click.agent().os();
            devices[i] = click.agent().device();
            bots[i] = click.agent().bot();
            visitorHashes[i] = click.visitorHash();
        }

        PreparedStatement ps = con.prepareStatement(INSERT_CLICKS);
        ps.setArray(1, con.createArrayOf("int8", shortUrlIds));
        ps.setArray(2, con.createArrayOf("text", clickedAts));
        ps.setArray(3, con.createArrayOf("text", referrerHosts));
        ps.setArray(4, con.createArrayOf("text", browsers));
        ps.setArray(5, con.createArrayOf("text", oses));
        ps.setArray(6, con.createArrayOf("text", devices));
        ps.setArray(7, con.createArrayOf("bool", bots));
        ps.setArray(8, con.createArrayOf("text", visitorHashes));
        return ps;
    }

    private ParsedClick parse(PendingClick click) {
        return new ParsedClick(click.shortUrlId(), click.clickedAt(), referrerHost(click.referrer()),
                UserAgentParser.parse(click.userAgent()), visitorHash(click.ip(), click.userAgent()));
    }

    // One total per link, bots left out. Sorted by link id so concurrent flushes lock the
    // link_stats rows in the same order and can't deadlock.
    private static List<LinkTotal> totals(List<ParsedClick> clicks) {
        Map<Long, LinkTotal> totals = new TreeMap<>();

        for (ParsedClick click : clicks) {
            if (click.agent().bot())
                continue;

            totals.merge(click.shortUrlId(), new LinkTotal(click.shortUrlId(), 1, click.clickedAt()),
                    (a, b) -> new LinkTotal(a.shortUrlId(), a.clicks() + 1,
                            a.lastClickedAt().isAfter(b.lastClickedAt()) ? a.lastClickedAt() : b.lastClickedAt()));
        }

        return List.copyOf(totals.values());
    }

    // "https://www.Twitter.com/some/path" -> "twitter.com"; null for direct visits
    // or unparsable headers
    static String referrerHost(String referrer) {
        if (referrer == null || referrer.isBlank())
            return null;
        
        try {
            String host = URI.create(referrer.trim()).getHost();
            if (host == null)
                return null;
            host = host.toLowerCase(Locale.ROOT);
            if (host.startsWith("www."))
                host = host.substring(4);
            return truncate(host, MAX_REFERRER_HOST_LENGTH);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String visitorHash(String ip, String userAgent) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String input = visitorSalt + "|" + ip + "|" + (userAgent == null ? "" : userAgent);
            return HexFormat.of().formatHex(digest.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is always available", e);
        }
    }

    private static String truncate(String value, int maxLength) {
        return value == null || value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
