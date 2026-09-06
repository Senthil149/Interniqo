package com.internship.platform.dto;

import jakarta.validation.constraints.NotNull;

public class IssueCredentialRequest {

    @NotNull(message = "applicationId is required")
    private Long applicationId;

    public IssueCredentialRequest() {
    }

    public IssueCredentialRequest(Long applicationId) {
        this.applicationId = applicationId;
    }

    public Long getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(Long applicationId) {
        this.applicationId = applicationId;
    }
}
