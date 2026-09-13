package com.internship.platform.dto;

import com.internship.platform.entity.Internship;

import java.math.BigDecimal;
import java.time.LocalDate;

public class InternshipResponse {

    private Long id;
    private Long companyId;
    private String companyName;
    private String title;
    private String description;
    private String requiredSkills;
    private String country;
    private String city;
    private String workMode;
    private String duration;
    private BigDecimal stipend;
    private String currency;
    private String eligibility;
    private String visaInformation;
    private boolean visaRequired;
    private boolean relocationRequired;
    private LocalDate deadline;
    private String status;
    private Integer riskScore;
    private String riskLevel;
    private java.util.List<String> riskReasons;
    private Boolean companyEmailVerified;
    private Boolean companyPersonalEmail;
    private Boolean companyWebsiteDomainMatch;
    private String companyWebsite;
    private String companyVerificationStatus;

    public static InternshipResponse from(Internship internship) {
        return from(internship, null);
    }

    public static InternshipResponse from(Internship internship, com.internship.platform.entity.RiskAssessment risk) {
        InternshipResponse r = new InternshipResponse();
        r.setId(internship.getId());
        // Company is already loaded in service layer before calling from(); safe to access.
        if (internship.getCompany() != null) {
            r.setCompanyId(internship.getCompany().getId());
            r.setCompanyName(internship.getCompany().getCompanyName());
            r.setCompanyEmailVerified(internship.getCompany().isEmailVerified());
            r.setCompanyPersonalEmail(internship.getCompany().isPersonalEmail());
            r.setCompanyWebsiteDomainMatch(internship.getCompany().isWebsiteDomainMatch());
            r.setCompanyWebsite(internship.getCompany().getWebsite());
            r.setCompanyVerificationStatus(internship.getCompany().getVerificationStatus());
        }
        r.setTitle(internship.getTitle());
        r.setDescription(internship.getDescription());
        r.setRequiredSkills(internship.getRequiredSkills());
        r.setCountry(internship.getCountry());
        r.setCity(internship.getCity());
        r.setWorkMode(internship.getWorkMode());
        r.setDuration(internship.getDuration());
        r.setStipend(internship.getStipend());
        r.setCurrency(internship.getCurrency());
        r.setEligibility(internship.getEligibility());
        r.setVisaInformation(internship.getVisaInformation());
        r.setVisaRequired(internship.isVisaRequired());
        r.setRelocationRequired(internship.isRelocationRequired());
        r.setDeadline(internship.getDeadline());
        r.setStatus(internship.getStatus());

        if (risk != null) {
            r.setRiskScore(risk.getScore());
            r.setRiskLevel(risk.getLevel().name());
            if (risk.getReasons() != null && !risk.getReasons().isBlank()) {
                r.setRiskReasons(java.util.Arrays.stream(risk.getReasons().split("\n"))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList());
            }
        }
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(String requiredSkills) { this.requiredSkills = requiredSkills; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getWorkMode() { return workMode; }
    public void setWorkMode(String workMode) { this.workMode = workMode; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public BigDecimal getStipend() { return stipend; }
    public void setStipend(BigDecimal stipend) { this.stipend = stipend; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getEligibility() { return eligibility; }
    public void setEligibility(String eligibility) { this.eligibility = eligibility; }

    public String getVisaInformation() { return visaInformation; }
    public void setVisaInformation(String visaInformation) { this.visaInformation = visaInformation; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public java.util.List<String> getRiskReasons() { return riskReasons; }
    public void setRiskReasons(java.util.List<String> riskReasons) { this.riskReasons = riskReasons; }

    public Boolean getCompanyEmailVerified() { return companyEmailVerified; }
    public void setCompanyEmailVerified(Boolean companyEmailVerified) { this.companyEmailVerified = companyEmailVerified; }

    public Boolean getCompanyPersonalEmail() { return companyPersonalEmail; }
    public void setCompanyPersonalEmail(Boolean companyPersonalEmail) { this.companyPersonalEmail = companyPersonalEmail; }

    public Boolean getCompanyWebsiteDomainMatch() { return companyWebsiteDomainMatch; }
    public void setCompanyWebsiteDomainMatch(Boolean companyWebsiteDomainMatch) { this.companyWebsiteDomainMatch = companyWebsiteDomainMatch; }

    public String getCompanyWebsite() { return companyWebsite; }
    public void setCompanyWebsite(String companyWebsite) { this.companyWebsite = companyWebsite; }

    public boolean isVisaRequired() { return visaRequired; }
    public void setVisaRequired(boolean visaRequired) { this.visaRequired = visaRequired; }

    public boolean isRelocationRequired() { return relocationRequired; }
    public void setRelocationRequired(boolean relocationRequired) { this.relocationRequired = relocationRequired; }

    public String getCompanyVerificationStatus() { return companyVerificationStatus; }
    public void setCompanyVerificationStatus(String companyVerificationStatus) { this.companyVerificationStatus = companyVerificationStatus; }
}
