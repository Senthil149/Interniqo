package com.internship.platform.dto;

public class CompanyProfileResponse {

    private Long id;
    private String companyName;
    private String email;
    private boolean emailVerified;
    private boolean personalEmail;
    private boolean websiteDomainMatch;
    private String emailDomain;
    private String website;
    private String country;
    private String description;
    private String notice;

    public static final String DESIGN_RULE_4_NOTICE =
            "Notice (Design Rule #4): Domain quality checks and email verification confirm inbox and domain control only. " +
            "They do not certify legal business incorporation, government registration, or legitimacy.";

    public CompanyProfileResponse() {
        this.notice = DESIGN_RULE_4_NOTICE;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public boolean isPersonalEmail() {
        return personalEmail;
    }

    public void setPersonalEmail(boolean personalEmail) {
        this.personalEmail = personalEmail;
    }

    public boolean isWebsiteDomainMatch() {
        return websiteDomainMatch;
    }

    public void setWebsiteDomainMatch(boolean websiteDomainMatch) {
        this.websiteDomainMatch = websiteDomainMatch;
    }

    public String getEmailDomain() {
        return emailDomain;
    }

    public void setEmailDomain(String emailDomain) {
        this.emailDomain = emailDomain;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getNotice() {
        return notice;
    }

    public void setNotice(String notice) {
        this.notice = notice;
    }
}
