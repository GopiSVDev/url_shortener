package com.urlshortener.controller;

import com.jayway.jsonpath.JsonPath;
import com.urlshortener.entity.ShortUrl;
import com.urlshortener.repository.ShortUrlRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class UrlControllerIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    @Autowired
    MockMvc mvc;
    @Autowired
    ShortUrlRepository shortUrlRepository;

    // ---------- helpers ----------

    private static String unique() {
        return "u" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private static String urlBody(String url) {
        return "{\"originalUrl\":\"%s\"}".formatted(url);
    }

    private static MockHttpServletRequestBuilder withAuth(MockHttpServletRequestBuilder b, String token) {
        return token == null ? b : b.header("Authorization", "Bearer " + token);
    }

    /**
     * Registers a new user and returns their access token.
     */
    private String newUserToken() throws Exception {
        String body = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"%s\",\"password\":\"Str0ng!Pass\"}".formatted(unique())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    private ResultActions create(String token, String json) throws Exception {
        return mvc.perform(withAuth(post("/api/urls"), token)
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private String createOk(String token, String url) throws Exception {
        String body = create(token, urlBody(url)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.shortCode");
    }

    private ResultActions putJson(String token, String code, String json) throws Exception {
        return mvc.perform(withAuth(put("/api/urls/" + code), token)
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private ResultActions deleteUrl(String token, String code) throws Exception {
        return mvc.perform(withAuth(delete("/api/urls/" + code), token));
    }

    // ---------- create ----------

    @Test
    void create_anonymous_returns201_andRedirects() throws Exception {
        String code = createOk(null, "https://example.com/path");
        mvc.perform(get("/" + code))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "https://example.com/path"));
    }

    @Test
    void create_loggedIn_appearsInMyUrls_butAnonymousDoesNot() throws Exception {
        String token = newUserToken();
        String mine = createOk(token, "https://example.com/mine");
        String anon = createOk(null, "https://example.com/anon");

        String list = mvc.perform(withAuth(get("/api/urls"), token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(list.contains(mine));
        assertFalse(list.contains(anon));
    }

    @Test
    void create_withoutScheme_isNormalizedToHttps() throws Exception {
        String body = create(null, urlBody("example.com/page")).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        assertEquals("https://example.com/page", JsonPath.read(body, "$.originalUrl"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "javascript:alert(1)", "ftp://x.com/a", "https://a@evil.com", "//evil.com",
            "data:text/html,hi", "", "   ", "https://", "not a url"
    })
    void create_badUrl_returns400(String url) throws Exception {
        create(null, urlBody(url)).andExpect(status().isBadRequest());
    }
    
    @Test
    void create_pastExpiration_returns400() throws Exception {
        create(null, "{\"originalUrl\":\"https://example.com\",\"expirationDate\":\"2020-01-01T00:00:00\"}")
                .andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "{}", "not json", "[]", "{\"originalUrl\":null}"})
    void create_malformedBody_returns400(String body) throws Exception {
        create(null, body).andExpect(status().isBadRequest());
    }

    // ---------- redirect ----------

    @Test
    void redirect_unknownCode_returns404() throws Exception {
        mvc.perform(get("/zzzzzzz")).andExpect(status().isNotFound());
    }

    @Test
    void redirect_expiredLink_returns410() throws Exception {
        String code = "x" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        shortUrlRepository.save(ShortUrl.builder()
                .shortCode(code)
                .originalUrl("https://example.com")
                .expirationDate(LocalDateTime.now().minusDays(1))
                .build());
        mvc.perform(get("/" + code)).andExpect(status().isGone());
    }

    // ---------- authentication on management routes ----------

    @Test
    void manage_withoutToken_returns401() throws Exception {
        String code = createOk(null, "https://example.com");
        mvc.perform(get("/api/urls")).andExpect(status().isUnauthorized());
        putJson(null, code, urlBody("https://example.org")).andExpect(status().isUnauthorized());
        deleteUrl(null, code).andExpect(status().isUnauthorized());
    }

    // ---------- ownership ----------

    @Test
    void owner_canUpdate_andRedirectChanges() throws Exception {
        String token = newUserToken();
        String code = createOk(token, "https://example.com/old");

        putJson(token, code, urlBody("https://example.org/new")).andExpect(status().isOk());

        mvc.perform(get("/" + code))
                .andExpect(header().string("Location", "https://example.org/new"));
    }

    @Test
    void owner_canDelete_thenRedirectIs404() throws Exception {
        String token = newUserToken();
        String code = createOk(token, "https://example.com");

        deleteUrl(token, code).andExpect(status().isNoContent());
        mvc.perform(get("/" + code)).andExpect(status().isNotFound());
    }

    @Test
    void otherUser_cannotUpdateOrDelete_returns403() throws Exception {
        String owner = newUserToken();
        String other = newUserToken();
        String code = createOk(owner, "https://example.com/mine");

        putJson(other, code, urlBody("https://evil.com")).andExpect(status().isForbidden());
        deleteUrl(other, code).andExpect(status().isForbidden());

        // unchanged
        mvc.perform(get("/" + code))
                .andExpect(header().string("Location", "https://example.com/mine"));
    }

    @Test
    void ownerlessLink_cannotBeUpdatedOrDeleted_byAnyUser() throws Exception {
        String code = createOk(null, "https://example.com/anon");
        String user = newUserToken();

        putJson(user, code, urlBody("https://evil.com")).andExpect(status().isForbidden());
        deleteUrl(user, code).andExpect(status().isForbidden());
    }

    @Test
    void updateOrDelete_unknownCode_returns404() throws Exception {
        String token = newUserToken();
        putJson(token, "nope123", urlBody("https://example.com")).andExpect(status().isNotFound());
        deleteUrl(token, "nope123").andExpect(status().isNotFound());
    }

    @Test
    void update_withInvalidUrl_returns400_andKeepsOldValue() throws Exception {
        String token = newUserToken();
        String code = createOk(token, "https://example.com/keep");

        putJson(token, code, urlBody("javascript:alert(1)")).andExpect(status().isBadRequest());
        mvc.perform(get("/" + code))
                .andExpect(header().string("Location", "https://example.com/keep"));
    }
}
