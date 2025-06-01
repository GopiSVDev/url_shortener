package com.gopisvdev.url_shortener.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "click_logs", indexes = {
        @Index(name = "idx_short_url_id", columnList = "short_url_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClickLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "short_url_id", nullable = false)
    @JsonBackReference
    private ShortUrl shortUrl;
    
    private LocalDateTime clickedAt = LocalDateTime.now();

    private String ip;
    private String deviceType;
    private String country;
    private String region;
    private String city;
}
