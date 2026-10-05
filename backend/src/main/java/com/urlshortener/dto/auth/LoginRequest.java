package com.urlshortener.dto.auth;

import com.urlshortener.validation.MaxBytes;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Username can't be empty")
    @Size(max = 50, message = "Invalid username or password")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(max = 72, message = "Invalid username or password")
    @MaxBytes(value = 72, message = "Invalid username or password")
    private String password;
}
