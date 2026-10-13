package com.urlshortener.service.analytics;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ClickRecorderTest {

    @ParameterizedTest
    @CsvSource(nullValues = "null", value = {
            "https://www.Twitter.com/some/path?x=1, twitter.com",
            "https://news.ycombinator.com/, news.ycombinator.com",
            "android-app://com.slack/, com.slack",
            "null, null",
            "'', null",
            "not a url, null",
            "/relative/path, null",
    })
    void referrerHost(String referrer, String expected) {
        assertEquals(expected, ClickRecorder.referrerHost(referrer));
    }
}
