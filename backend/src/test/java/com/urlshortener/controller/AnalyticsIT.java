package com.urlshortener.controller;

import com.jayway.jsonpath.JsonPath;
import com.urlshortener.service.analytics.ClickRecorder;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AnalyticsIT {

    private static final String CHROME_WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            + "(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
    private static final String SAFARI_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) "
            + "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
    private static final String GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    @Autowired
    MockMvc mvc;
    @Autowired
    ClickRecorder clickRecorder;
    @Autowired
    JdbcTemplate jdbcTemplate;

    // ---------- helpers ----------

    private String newUserToken() throws Exception {
        String username = "u" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String body = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"%s\",\"password\":\"Str0ng!Pass\"}".formatted(username)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    private String createLink(String token) throws Exception {
        var request = post("/api/urls").contentType(MediaType.APPLICATION_JSON)
                .content("{\"originalUrl\":\"https://example.com\"}");
        if (token != null) request.header("Authorization", "Bearer " + token);
        String body = mvc.perform(request).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.shortCode");
    }

    private void click(String code, String ip, String userAgent, String referrer) throws Exception {
        var request = get("/" + code).with(r -> {
            r.setRemoteAddr(ip);
            return r;
        });
        if (userAgent != null) request.header("User-Agent", userAgent);
        if (referrer != null) request.header("Referer", referrer);
        mvc.perform(request).andExpect(status().isFound());
    }

    private ResultActions analytics(String token, String code, String query) throws Exception {
        var request = get("/api/urls/" + code + "/analytics" + query);
        if (token != null) request.header("Authorization", "Bearer " + token);
        return mvc.perform(request);
    }

    // ---------- recording and stats ----------

    @Test
    void redirects_areCounted_withBreakdowns_andBotsExcluded() throws Exception {
        String token = newUserToken();
        String code = createLink(token);

        click(code, "10.0.0.1", CHROME_WINDOWS, "https://www.twitter.com/post/1");
        click(code, "10.0.0.1", CHROME_WINDOWS, "https://twitter.com/post/2"); // same visitor again
        click(code, "10.0.0.2", SAFARI_IPHONE, null);
        click(code, "10.0.0.3", GOOGLEBOT, null);
        clickRecorder.flush();

        analytics(token, code, "?days=7")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shortCode").value(code))
                .andExpect(jsonPath("$.days").value(7))
                .andExpect(jsonPath("$.totalClicks").value(3))
                .andExpect(jsonPath("$.periodClicks").value(3))
                .andExpect(jsonPath("$.uniqueVisitors").value(2))
                .andExpect(jsonPath("$.botClicks").value(1))
                .andExpect(jsonPath("$.lastClickedAt").isNotEmpty())
                .andExpect(jsonPath("$.clicksPerDay", hasSize(7)))
                .andExpect(jsonPath("$.clicksPerDay[6].date").value(LocalDate.now().toString()))
                .andExpect(jsonPath("$.clicksPerDay[6].clicks").value(3))
                .andExpect(jsonPath("$.clicksPerDay[0].clicks").value(0))
                .andExpect(jsonPath("$.referrers[0].name").value("twitter.com"))
                .andExpect(jsonPath("$.referrers[0].clicks").value(2))
                .andExpect(jsonPath("$.referrers[1].name").value("Direct"))
                .andExpect(jsonPath("$.browsers[0].name").value("Chrome"))
                .andExpect(jsonPath("$.operatingSystems[0].name").value("Windows"))
                .andExpect(jsonPath("$.devices[0].name").value("Desktop"))
                .andExpect(jsonPath("$.devices[1].name").value("Mobile"));
    }

    @Test
    void newLink_hasEmptyStats() throws Exception {
        String token = newUserToken();
        String code = createLink(token);

        analytics(token, code, "")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days").value(30))
                .andExpect(jsonPath("$.totalClicks").value(0))
                .andExpect(jsonPath("$.lastClickedAt").doesNotExist())
                .andExpect(jsonPath("$.clicksPerDay", hasSize(30)))
                .andExpect(jsonPath("$.referrers", hasSize(0)));
    }

    @Test
    void myLinks_showClickCounts() throws Exception {
        String token = newUserToken();
        String clicked = createLink(token);
        String notClicked = createLink(token);

        click(clicked, "10.0.0.1", CHROME_WINDOWS, null);
        click(clicked, "10.0.0.2", CHROME_WINDOWS, null);
        click(clicked, "10.0.0.3", GOOGLEBOT, null);
        clickRecorder.flush();

        // newest first
        mvc.perform(get("/api/urls").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].shortCode").value(notClicked))
                .andExpect(jsonPath("$[0].clickCount").value(0))
                .andExpect(jsonPath("$[1].shortCode").value(clicked))
                .andExpect(jsonPath("$[1].clickCount").value(2));
    }

    @Test
    void clickTotals_addUpAcrossFlushes() throws Exception {
        String token = newUserToken();
        String code = createLink(token);

        click(code, "10.0.0.1", CHROME_WINDOWS, null);
        click(code, "10.0.0.2", CHROME_WINDOWS, null);
        clickRecorder.flush();
        click(code, "10.0.0.3", SAFARI_IPHONE, null);
        click(code, "10.0.0.4", GOOGLEBOT, null);
        clickRecorder.flush();

        mvc.perform(get("/api/urls").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$[0].clickCount").value(3));
        analytics(token, code, "")
                .andExpect(jsonPath("$.totalClicks").value(3))
                .andExpect(jsonPath("$.botClicks").value(1));
    }

    @Test
    void deletingLink_deletesItsClicksAndTotals() throws Exception {
        String token = newUserToken();
        String code = createLink(token);
        click(code, "10.0.0.1", CHROME_WINDOWS, null);
        clickRecorder.flush();
        Long id = jdbcTemplate.queryForObject("select id from short_urls where short_code = ?", Long.class, code);

        mvc.perform(delete("/api/urls/" + code).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertEquals(0, jdbcTemplate.queryForObject(
                "select count(*) from clicks where short_url_id = ?", Long.class, id));
        assertEquals(0, jdbcTemplate.queryForObject(
                "select count(*) from link_stats where short_url_id = ?", Long.class, id));
    }

    @Test
    void clickOnLinkDeletedBeforeFlush_isSkipped() throws Exception {
        String token = newUserToken();
        String code = createLink(token);
        String other = createLink(token);
        click(code, "10.0.0.1", CHROME_WINDOWS, null);
        click(other, "10.0.0.1", CHROME_WINDOWS, null);

        mvc.perform(delete("/api/urls/" + code).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        clickRecorder.flush();

        // the click on the deleted link does not fail the batch
        analytics(token, other, "").andExpect(jsonPath("$.totalClicks").value(1));
    }

    // ---------- access ----------

    @Test
    void analytics_withoutToken_returns401() throws Exception {
        String code = createLink(newUserToken());
        analytics(null, code, "").andExpect(status().isUnauthorized());
    }

    @Test
    void analytics_ofOtherUsersOrAnonymousLink_returns403() throws Exception {
        String token = newUserToken();
        String othersLink = createLink(newUserToken());
        String anonymousLink = createLink(null);

        analytics(token, othersLink, "").andExpect(status().isForbidden());
        analytics(token, anonymousLink, "").andExpect(status().isForbidden());
    }

    @Test
    void analytics_unknownCode_returns404() throws Exception {
        analytics(newUserToken(), "nope123", "").andExpect(status().isNotFound());
    }

    @Test
    void analytics_daysOutOfRange_returns400() throws Exception {
        String token = newUserToken();
        String code = createLink(token);
        analytics(token, code, "?days=0").andExpect(status().isBadRequest());
        analytics(token, code, "?days=366").andExpect(status().isBadRequest());
    }
}
