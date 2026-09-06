package com.internship.platform.dto;

import jakarta.validation.constraints.Email;

public class ResendVerificationRequest {

    @Email(message = "Invalid email format")
    private String email;

    public ResendVerificationRequest() {
    }

    public ResendVerificationRequest(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
