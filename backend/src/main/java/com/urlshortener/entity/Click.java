package com.urlshortener.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "clicks", indexes = {
        @Index(name = "idx_clicks_short_url_clicked_at", columnList = "short_url_id, clicked_at")
})
@Getter
@Setter
@NoArgsConstructor
public class Click {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // No foreign key: Postgres checked it on every click insert (~0.06 ms per redirect). Clicks of a deleted
    // link are deleted by UrlService.deleteUrl; inserts skip clicks whose link no longer exists.
    @Column(name = "short_url_id", nullable = false)
    private Long shortUrlId;

    @Column(name = "clicked_at", nullable = false)
    private LocalDateTime clickedAt;

    // Host of the Referer header (e.g. "twitter.com"), null for direct visits
    @Column(name = "referrer_host")
    private String referrerHost;

    @Column(nullable = false, length = 32)
    private String browser;

    @Column(nullable = false, length = 32)
    private String os;

    @Column(nullable = false, length = 16)
    private String device;

    // Crawlers and link previews (Slack, WhatsApp, ...) are stored but left out of the stats
    @Column(nullable = false)
    private boolean bot;

    // SHA-256 of salt + IP + User-Agent, used to count unique visitors
    @Column(name = "visitor_hash", nullable = false, length = 64)
    private String visitorHash;
}
