package com.gopisvdev.url_shortener.repository;

import com.gopisvdev.url_shortener.entity.ShortUrl;
import com.gopisvdev.url_shortener.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShortUrlRepository extends JpaRepository<ShortUrl, Long> {
    Optional<ShortUrl> findByShortCode(String shortCode);

    boolean existsByShortCode(String shortCode);

    List<ShortUrl> findAllByCreatedBy(User user);

    
}
