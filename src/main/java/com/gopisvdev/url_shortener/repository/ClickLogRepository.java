package com.gopisvdev.url_shortener.repository;

import com.gopisvdev.url_shortener.entity.ClickLog;
import com.gopisvdev.url_shortener.entity.ShortUrl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClickLogRepository extends JpaRepository<ClickLog, Long> {
    List<ClickLog> findByShortUrlIn(List<ShortUrl> urls);

    @Query("SELECT FUNCTION('DATE', cl.clickedAt), COUNT(cl) FROM ClickLog cl WHERE cl.shortUrl = :url GROUP BY FUNCTION('DATE', cl.clickedAt)")
    List<Object[]> countClicksOverTime(@Param("url") ShortUrl url);

    @Query("SELECT cl.deviceType, COUNT(cl) FROM ClickLog cl WHERE cl.shortUrl = :url GROUP BY cl.deviceType")
    List<Object[]> countClicksByDeviceType(@Param("url") ShortUrl url);

    @Query("SELECT cl.city, COUNT(cl) FROM ClickLog cl WHERE cl.shortUrl = :url GROUP BY cl.city")
    List<Object[]> countClicksByCity(@Param("url") ShortUrl url);

    @Query("SELECT cl.country, COUNT(cl) FROM ClickLog cl WHERE cl.shortUrl = :url GROUP BY cl.country")
    List<Object[]> countClicksByCountry(@Param("url") ShortUrl url);


    @Query("SELECT FUNCTION('DATE', cl.clickedAt), COUNT(cl) FROM ClickLog cl WHERE cl.shortUrl IN :urls GROUP BY FUNCTION('DATE', cl.clickedAt)")
    List<Object[]> countClicksOverTime(@Param("urls") List<ShortUrl> urls);

    @Query("SELECT cl.deviceType, COUNT(cl) FROM ClickLog cl WHERE cl.shortUrl IN :urls GROUP BY cl.deviceType")
    List<Object[]> countClicksByDeviceType(@Param("urls") List<ShortUrl> urls);

    @Query("SELECT cl.city, COUNT(cl) FROM ClickLog cl WHERE cl.shortUrl IN :urls GROUP BY cl.city")
    List<Object[]> countClicksByCity(@Param("urls") List<ShortUrl> urls);

    @Query("SELECT cl.country, COUNT(cl) FROM ClickLog cl WHERE cl.shortUrl IN :urls GROUP BY cl.country")
    List<Object[]> countClicksByCountry(@Param("urls") List<ShortUrl> urls);
}
