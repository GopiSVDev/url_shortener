package com.urlshortener.util;

import java.util.regex.Pattern;

// Small User-Agent parser for click stats: browser, OS and device type, plus bot detection.
// Covers the common browsers; anything else is "Other". Order of the checks matters because
// most User-Agents name several engines (Edge contains "Chrome" and "Safari", Chrome contains "Safari").
public final class UserAgentParser {
    private static final Pattern BOT = Pattern.compile(
            "bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|skype|"
                    + "curl|wget|python|java/|go-http|okhttp|axios|node-fetch|headless|lighthouse|k6",
            Pattern.CASE_INSENSITIVE);

    public record UserAgent(String browser, String os, String device, boolean bot) {
    }

    private UserAgentParser() {
    }

    public static UserAgent parse(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            // Real browsers always send a User-Agent; scripts often don't
            return new UserAgent("Other", "Other", "Bot", true);
        }

        boolean bot = BOT.matcher(userAgent).find();
        return new UserAgent(browser(userAgent), os(userAgent), bot ? "Bot" : device(userAgent), bot);
    }

    private static String browser(String ua) {
        if (ua.contains("Edg/") || ua.contains("EdgA/") || ua.contains("EdgiOS/")) return "Edge";
        if (ua.contains("OPR/") || ua.contains("Opera")) return "Opera";
        if (ua.contains("SamsungBrowser/")) return "Samsung Internet";
        if (ua.contains("Firefox/") || ua.contains("FxiOS/")) return "Firefox";
        if (ua.contains("Chrome/") || ua.contains("CriOS/")) return "Chrome";
        if (ua.contains("Safari/")) return "Safari";
        return "Other";
    }

    private static String os(String ua) {
        if (ua.contains("Windows")) return "Windows";
        if (ua.contains("iPhone") || ua.contains("iPad") || ua.contains("iPod")) return "iOS";
        if (ua.contains("Android")) return "Android";
        if (ua.contains("CrOS")) return "ChromeOS";
        if (ua.contains("Mac OS X") || ua.contains("Macintosh")) return "macOS";
        if (ua.contains("Linux")) return "Linux";
        return "Other";
    }

    private static String device(String ua) {
        if (ua.contains("iPad") || ua.contains("Tablet") || (ua.contains("Android") && !ua.contains("Mobile"))) {
            return "Tablet";
        }
        if (ua.contains("Mobi") || ua.contains("iPhone") || ua.contains("iPod")) return "Mobile";
        return "Desktop";
    }
}
