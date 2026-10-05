package com.urlshortener.service.auth;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Encoders;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Base64;

public class JwtServiceTest {
    private static final String SECRET = newSecret();
    private final JwtService jwt = new JwtService(SECRET, 60_000, 600_000);
    private final UserDetails alice = User.withUsername("alice").password("x").roles("USER").build();

    private static String newSecret() {
        return Encoders.BASE64.encode(Jwts.SIG.HS256.key().build().getEncoded());
    }

    @Test
    void validAccessToken_isAccepted() {
        assertTrue(jwt.validateToken(jwt.generateAccessToken("alice"), alice));
    }

    @Test
    void refreshToken_isRejectedAsAccessToken() {
        assertFalse(jwt.validateToken(jwt.generateRefreshToken("alice"), alice));
    }

    @Test
    void tokenForDifferentUser_isRejected() {
        assertFalse(jwt.validateToken(jwt.generateAccessToken("bob"), alice));
    }

    @Test
    void expiredToken_isRejected() {
        JwtService expired = new JwtService(SECRET, -1_000, -1_000);
        assertFalse(jwt.validateToken(expired.generateAccessToken("alice"), alice));
    }

    @Test
    void tokenSignedWithOtherKey_isRejected() {
        JwtService other = new JwtService(newSecret(), 60_000, 600_000);
        assertFalse(jwt.validateToken(other.generateAccessToken("alice"), alice));
    }

    @Test
    void tamperedToken_isRejected() {
        String token = jwt.generateAccessToken("alice");
        String tampered = token.substring(0, token.length() - 2) + "xx";
        assertFalse(jwt.validateToken(tampered, alice));
    }

    @Test
    void algNoneToken_isRejected() {
        var enc = Base64.getUrlEncoder().withoutPadding();
        String header = enc.encodeToString("{\"alg\":\"none\"}".getBytes());
        String payload = enc.encodeToString(
                "{\"sub\":\"alice\",\"type\":\"access\",\"exp\":9999999999}".getBytes());
        assertFalse(jwt.validateToken(header + "." + payload + ".", alice));
    }

    @Test
    void garbage_isRejected() {
        assertFalse(jwt.validateToken("abc.def.ghi", alice));
        assertFalse(jwt.validateToken("", alice));
    }

    @Test
    void shortSecret_failsAtStartup() {
        String tooShort = Encoders.BASE64.encode("short".getBytes());
        assertThrows(Exception.class, () -> new JwtService(tooShort, 1, 1));
    }

    @Test
    void refreshExtraction_acceptsRefreshToken_rejectsAccessToken() {
        assertEquals("alice", jwt.extractUsernameFromRefreshToken(jwt.generateRefreshToken("alice")));
        assertThrows(JwtException.class,
                () -> jwt.extractUsernameFromRefreshToken(jwt.generateAccessToken("alice")));
    }
}
