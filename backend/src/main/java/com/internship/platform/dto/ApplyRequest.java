package com.internship.platform.dto;

import jakarta.validation.constraints.NotNull;

public class ApplyRequest {

    @NotNull(message = "internshipId is required")
    private Long internshipId;

    public ApplyRequest() {
    }

    public ApplyRequest(Long internshipId) {
        this.internshipId = internshipId;
    }

    public Long getInternshipId() {
        return internshipId;
    }

    public void setInternshipId(Long internshipId) {
        this.internshipId = internshipId;
    }
}
