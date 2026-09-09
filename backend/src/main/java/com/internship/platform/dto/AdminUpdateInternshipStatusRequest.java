package com.internship.platform.dto;

import jakarta.validation.constraints.NotBlank;

public class AdminUpdateInternshipStatusRequest {

    @NotBlank(message = "status is required")
    private String status;

    public AdminUpdateInternshipStatusRequest() {
    }

    public AdminUpdateInternshipStatusRequest(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
