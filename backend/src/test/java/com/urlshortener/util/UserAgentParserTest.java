package com.urlshortener.util;

import com.urlshortener.util.UserAgentParser.UserAgent;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UserAgentParserTest {

    @ParameterizedTest(name = "{1} / {2} / {3}")
    @CsvSource(delimiter = '|', nullValues = "null", value = {
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
                    + "|Chrome|Windows|Desktop|false",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0"
                    + "|Edge|Windows|Desktop|false",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"
                    + "|Safari|macOS|Desktop|false",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
                    + "|Safari|iOS|Mobile|false",
            "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0 Mobile/15E148 Safari/604.1"
                    + "|Chrome|iOS|Tablet|false",
            "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36"
                    + "|Chrome|Android|Mobile|false",
            "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Safari/537.36"
                    + "|Samsung Internet|Android|Tablet|false",
            "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0"
                    + "|Firefox|Linux|Desktop|false",
            "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
                    + "|Other|Other|Bot|true",
            "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)"
                    + "|Other|Other|Bot|true",
            "curl/8.5.0|Other|Other|Bot|true",
            "null|Other|Other|Bot|true",
    })
    void parsesCommonUserAgents(String userAgent, String browser, String os, String device, boolean bot) {
        assertEquals(new UserAgent(browser, os, device, bot), UserAgentParser.parse(userAgent));
    }
}
