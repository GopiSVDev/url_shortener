package com.gopisvdev.url_shortener.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    private SecretKey getKey() {
        //        just for testing purpose
        String secretKey = "019f98efaa3aa61efb5c7316c9295f204345920593911966699697ab875feb9435c259af2115027c634273e5241333f38078fe9e4d702457da0d5b819984f7c258b434c2dc776d03f7b3d338ad20ad3d5d65f72885155a153053392c5a8ca27df1a97309bccd0dda0f2bfcdccdaf158ecd46674683eb0ddbb5572bf46197d86ea3127886a5d1b06245620b4fd302c9fda5cccd7ce93d480b4d66b30a282fca5e3e5a060c4025a9cdf4692973e5ba48acbadc5e9555bd76aa29a694d8b3059943a8b5df294378e797d6ad4eef19ca2ce355b329f7f190e062c3690c6286382a12906a70f87af503e959228f5867a2feacf4a70e5d4426a6cc6bb9d4deb390dad4";
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    public String extractUsername(String token) {
        Claims claims = extractAllClaims(token);
        return claims.getSubject();
    }

    public Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, username);
    }

    public String createToken(Map<String, Object> claims, String subject) {
        long expirationTime = 1000 * 60 * 60 * 24 * 7;

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .header().empty().add("typ", "JWT")
                .and()
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(getKey())
                .compact();
    }

    public Boolean validateToken(String token) {
        return !isTokenExpired(token);
    }
}
