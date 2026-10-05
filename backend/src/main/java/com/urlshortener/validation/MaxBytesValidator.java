package com.urlshortener.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.nio.charset.StandardCharsets;

public class MaxBytesValidator implements ConstraintValidator<MaxBytes, String> {
    private int max;

    @Override
    public void initialize(MaxBytes a) {
        this.max = a.value();
    }

    @Override
    public boolean isValid(String v, ConstraintValidatorContext c) {
        return v == null || v.getBytes(StandardCharsets.UTF_8).length <= max;
    }
}
