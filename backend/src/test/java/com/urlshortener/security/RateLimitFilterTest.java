package com.urlshortener.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RateLimitFilterTest {

    private final RateLimitFilter filter = new RateLimitFilter(true);

    private int send(String method, String path, String ip) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response.getStatus();
    }

    @Test
    void loginIsLimitedPerIp() throws Exception {
        for (int i = 0; i < 10; i++) {
            assertEquals(200, send("POST", "/api/auth/login", "10.0.0.1"));
        }
        assertEquals(429, send("POST", "/api/auth/login", "10.0.0.1"));
        // other IPs and other limits are counted separately
        assertEquals(200, send("POST", "/api/auth/login", "10.0.0.2"));
        assertEquals(200, send("POST", "/api/urls", "10.0.0.1"));
    }

    @Test
    void otherEndpointsAreNotLimited() throws Exception {
        for (int i = 0; i < 100; i++) {
            assertEquals(200, send("GET", "/abc1234", "10.0.0.1"));
        }
    }
}
