package com.internship.platform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ResendCodeRequest {

    @NotBlank(message = "Email address is required")
    @Email(message = "Must be a valid email address")
    private String email;

    public ResendCodeRequest() {
    }

    public ResendCodeRequest(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
