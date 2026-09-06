package com.internship.platform.dto;

/**
 * Response for email verification token validation.
 *
 * Design Rule #4 compliance: The response explicitly highlights that verification
 * confirms control of the domain inbox only, never legal company identity.
 */
public class VerifyEmailResponse {

    private boolean verified;
    private String message;
    private String email;
    private String companyName;
    private String notice = "Notice: In accordance with platform policy (Design Rule #4), " +
            "this verification confirms access to the domain inbox only and does not serve as " +
            "legal proof of company identity or certification.";

    public VerifyEmailResponse() {
    }

    public VerifyEmailResponse(boolean verified, String message, String email, String companyName) {
        this.verified = verified;
        this.message = message;
        this.email = email;
        this.companyName = companyName;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getNotice() {
        return notice;
    }

    public void setNotice(String notice) {
        this.notice = notice;
    }
}
