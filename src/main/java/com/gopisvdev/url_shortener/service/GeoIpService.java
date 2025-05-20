package com.gopisvdev.url_shortener.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Service
public class GeoIpService {
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String IP_API_URL = "http://ip-api.com/json/";

    public GeoInfo lookup(String ip) {
        try {
            String url = UriComponentsBuilder.fromUriString(IP_API_URL + ip)
                    .queryParam("fields", "status,message,country,regionName,city")
                    .toUriString();

            Map<String, String> response = restTemplate.getForObject(url, Map.class);

            if ("success".equals(response.get("status"))) {
                return new GeoInfo(
                        response.get("country"),
                        response.get("regionName"),
                        response.get("city")
                );
            } else {
                return null;
            }
        } catch (Exception e) {
            return null;
        }
    }

    public record GeoInfo(String country, String region, String city) {
    }
}
