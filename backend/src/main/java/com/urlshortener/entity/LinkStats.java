package com.urlshortener.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;


@Entity
@Table(name = "link_stats")
@Getter
@Setter
@NoArgsConstructor
public class LinkStats {
    @Id
    @Column(name = "short_url_id")
    private Long shortUrlId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "short_url_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private ShortUrl shortUrl;

    @Column(name = "click_count", nullable = false)
    private long clickCount;

    @Column(name = "last_clicked_at", nullable = false)
    private LocalDateTime lastClickedAt;
}
