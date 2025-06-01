package com.gopisvdev.url_shortener.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "short_urls", indexes = {
        @Index(name = "idx_short_code", columnList = "short_code", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShortUrl {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "short_code", nullable = false)
    private String shortCode;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String originalUrl;

    @OneToMany(mappedBy = "shortUrl", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<ClickLog> clickLogs = new ArrayList<>();

    @Column(nullable = false)
    private Long clickCount = 0L;

    private LocalDateTime expirationDate;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonBackReference
    private User createdBy;
}
