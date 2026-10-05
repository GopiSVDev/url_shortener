package com.urlshortener.controller;

import com.jayway.jsonpath.JsonPath;
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
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AuthControllerIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    @Autowired
    MockMvc mvc;

    // ---------- helpers ----------

    private ResultActions postJson(String url, String json) throws Exception {
        return mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private static String creds(String user, String pass) {
        return "{\"username\":\"%s\",\"password\":\"%s\"}".formatted(user, pass);
    }

    private static String unique() {
        return "u" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private String register(String user, String pass) throws Exception {
        return postJson("/api/auth/register", creds(user, pass))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
    }

    // ---------- register ----------

    @Test
    void register_success_returnsTokens_andNoPassword() throws Exception {
        String body = register(unique(), "Str0ng!Pass");
        assertNotNull(JsonPath.read(body, "$.accessToken"));
        assertFalse(body.contains("password"));
    }

    @Test
    void register_duplicate_returns409_evenWithDifferentCase() throws Exception {
        String name = unique();
        register(name, "Str0ng!Pass");
        postJson("/api/auth/register", creds(name.toUpperCase(), "Str0ng!Pass"))
                .andExpect(status().isConflict());
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "", "not json", "[]", "{}",
            "{\"username\":null,\"password\":null}",
            "{\"username\":\"   \",\"password\":\"Str0ng!Pass\"}",
            "{\"username\":\"ab\",\"password\":\"Str0ng!Pass\"}",
            "{\"username\":\"has space\",\"password\":\"Str0ng!Pass\"}",
            "{\"username\":\"validname\",\"password\":\"short\"}"
    })
    void register_badInput_returns400(String body) throws Exception {
        postJson("/api/auth/register", body).andExpect(status().isBadRequest());
    }

    @Test
    void register_passwordOver72Bytes_returns400_not500() throws Exception {
        postJson("/api/auth/register", creds(unique(), "a".repeat(73)))
                .andExpect(status().isBadRequest());
        // 30 emoji = 120 bytes but only 30 characters
        postJson("/api/auth/register", creds(unique(), "😀".repeat(30)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_wrongMethodAndContentType() throws Exception {
        mvc.perform(get("/api/auth/register")).andExpect(status().isMethodNotAllowed());
        mvc.perform(post("/api/auth/register").contentType(MediaType.TEXT_PLAIN).content("x")).andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void register_concurrentDuplicates_exactlyOneWins() throws Exception {
        String body = creds(unique(), "Str0ng!Pass");
        var pool = Executors.newFixedThreadPool(8);
        try {
            var futures = IntStream.range(0, 8)
                    .mapToObj(i -> pool.submit(() ->
                            postJson("/api/auth/register", body).andReturn().getResponse().getStatus()))
                    .toList();
            List<Integer> statuses = futures.stream().map(f -> {
                try {
                    return f.get();
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }).toList();

            assertEquals(1, statuses.stream().filter(s -> s == 201).count());
            assertTrue(statuses.stream().allMatch(s -> s == 201 || s == 409), statuses.toString());
        } finally {
            pool.shutdown();
        }
    }

    // ---------- login ----------

    @Test
    void login_success_caseInsensitiveUsername() throws Exception {
        String name = unique();
        register(name, "Str0ng!Pass");
        postJson("/api/auth/login", creds(name, "Str0ng!Pass")).andExpect(status().isOk());
        postJson("/api/auth/login", creds(name.toUpperCase(), "Str0ng!Pass")).andExpect(status().isOk());
    }

    @Test
    void login_wrongPassword_and_unknownUser_areIndistinguishable() throws Exception {
        String name = unique();
        register(name, "Str0ng!Pass");

        String wrong = postJson("/api/auth/login", creds(name, "WrongPass1"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        String unknown = postJson("/api/auth/login", creds(unique(), "WrongPass1"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        // compare the message only; timestamp differs between responses
        assertEquals(JsonPath.<String>read(wrong, "$.message"), JsonPath.<String>read(unknown, "$.message"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "{}", "not json", "{\"username\":\"\",\"password\":\"\"}"})
    void login_badInput_returns400(String body) throws Exception {
        postJson("/api/auth/login", body).andExpect(status().isBadRequest());
    }

    @Test
    void login_hugeInput_returns400() throws Exception {
        postJson("/api/auth/login", creds("a".repeat(100_000), "x")).andExpect(status().isBadRequest());
        postJson("/api/auth/login", creds("alice", "a".repeat(100_000))).andExpect(status().isBadRequest());
    }

    // ---------- protected routes / tokens ----------

    @Test
    void protectedRoute_noToken_returns401() throws Exception {
        mvc.perform(get("/api/some-protected-route")).andExpect(status().isUnauthorized());
    }

    @Test
    void protectedRoute_garbageToken_returns401() throws Exception {
        mvc.perform(get("/api/some-protected-route").header("Authorization", "Bearer abc.def.ghi"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedRoute_refreshTokenCannotBeUsedAsAccessToken() throws Exception {
        String body = register(unique(), "Str0ng!Pass");
        String refresh = JsonPath.read(body, "$.refreshToken");
        mvc.perform(get("/api/some-protected-route").header("Authorization", "Bearer " + refresh))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedRoute_validAccessToken_passesSecurity() throws Exception {
        String body = register(unique(), "Str0ng!Pass");
        String access = JsonPath.read(body, "$.accessToken");
        // route doesn't exist, so 404 proves security let the request through
        mvc.perform(get("/api/some-protected-route").header("Authorization", "Bearer " + access))
                .andExpect(status().isNotFound());
    }

    @Test
    void refresh_withRefreshToken_returnsWorkingAccessToken() throws Exception {
        String body = register(unique(), "Str0ng!Pass");
        String refresh = JsonPath.read(body, "$.refreshToken");

        String refreshed = postJson("/api/auth/refresh", "{\"refreshToken\":\"%s\"}".formatted(refresh))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        String newAccess = JsonPath.read(refreshed, "$.accessToken");
        mvc.perform(get("/api/some-protected-route").header("Authorization", "Bearer " + newAccess))
                .andExpect(status().isNotFound());   // 404 = security let it through
    }

    @Test
    void refresh_withAccessTokenOrGarbage_returns401() throws Exception {
        String body = register(unique(), "Str0ng!Pass");
        String access = JsonPath.read(body, "$.accessToken");

        postJson("/api/auth/refresh", "{\"refreshToken\":\"%s\"}".formatted(access))
                .andExpect(status().isUnauthorized());
        postJson("/api/auth/refresh", "{\"refreshToken\":\"abc.def.ghi\"}")
                .andExpect(status().isUnauthorized());
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "{}", "not json", "{\"refreshToken\":\"\"}", "{\"refreshToken\":null}"})
    void refresh_badInput_returns400(String body) throws Exception {
        postJson("/api/auth/refresh", body).andExpect(status().isBadRequest());
    }
}
