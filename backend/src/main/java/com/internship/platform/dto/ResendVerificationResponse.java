package com.internship.platform.dto;

/**
 * Response for resending email verification link.
 *
 * Design Rule #4 compliance: Clarifies that the verification email confirms inbox control only.
 */
public class ResendVerificationResponse {

    private boolean success;
    private String message;
    private String notice = "Notice: Verification confirms control of the domain inbox only, " +
            "not legal company identity (Design Rule #4).";

    public ResendVerificationResponse() {
    }

    public ResendVerificationResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getNotice() {
        return notice;
    }

    public void setNotice(String notice) {
        this.notice = notice;
    }
}
