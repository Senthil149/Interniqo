package com.internship.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;

public class InternshipRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private String requiredSkills;

    @NotBlank(message = "Country is required")
    private String country;

    private String city;

    @NotBlank(message = "Work mode is required")
    private String workMode;

    private String duration;

    private BigDecimal stipend;

    private String currency;

    private String eligibility;

    private String visaInformation;

    private Boolean visaRequired;

    private Boolean relocationRequired;

    private LocalDate deadline;

    // Only used on update; create always sets OPEN.
    @Pattern(regexp = "OPEN|CLOSED", message = "Status must be OPEN or CLOSED")
    private String status;

    public Boolean getVisaRequired() { return visaRequired; }
    public void setVisaRequired(Boolean visaRequired) { this.visaRequired = visaRequired; }

    public Boolean getRelocationRequired() { return relocationRequired; }
    public void setRelocationRequired(Boolean relocationRequired) { this.relocationRequired = relocationRequired; }

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
}
