package com.internship.platform.dto;

import jakarta.validation.constraints.NotNull;

public class AdminToggleCompanyVerificationRequest {

    @NotNull(message = "verified is required")
    private Boolean verified;

    public AdminToggleCompanyVerificationRequest() {
    }

    public AdminToggleCompanyVerificationRequest(Boolean verified) {
        this.verified = verified;
    }

    public Boolean getVerified() {
        return verified;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }
}
