package com.gopisvdev.url_shortener.controller;

import com.google.zxing.WriterException;
import com.gopisvdev.url_shortener.service.QrCodeService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/qr")
public class QrCodeController {
    private final QrCodeService qrCodeService;

    public QrCodeController(QrCodeService qrCodeService) {
        this.qrCodeService = qrCodeService;
    }

    @GetMapping("/{code}")
    public ResponseEntity<byte[]> getQrCode(@PathVariable String code, HttpServletRequest request) {
        String baseUrl = String.format("%s://%s:%d",
                request.getScheme(),
                request.getServerName(),
                request.getServerPort()
        );
        
        if ((request.getScheme().equals("http") && request.getServerPort() == 80) ||
                (request.getScheme().equals("https") && request.getServerPort() == 443)) {
            baseUrl = String.format("%s://%s", request.getScheme(), request.getServerName());
        }

        String url = baseUrl + "/" + code;

        try {
            byte[] qrImage = qrCodeService.generateQRCodeImage(url, 250, 250);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE)
                    .body(qrImage);
        } catch (WriterException e) {
            return ResponseEntity.status(500).build();
        }
    }
}
