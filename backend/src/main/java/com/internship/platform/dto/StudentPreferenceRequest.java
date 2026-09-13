package com.internship.platform.dto;

import java.math.BigDecimal;

public class StudentPreferenceRequest {

    private String country;
    private String preferredCountries;
    private String location;
    private String workMode;
    private String duration;
    private BigDecimal minimumStipend;
    private String currency;
    private Boolean visaRequired;
    private Boolean relocationPreference;

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getPreferredCountries() {
        return preferredCountries;
    }

    public void setPreferredCountries(String preferredCountries) {
        this.preferredCountries = preferredCountries;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getWorkMode() {
        return workMode;
    }

    public void setWorkMode(String workMode) {
        this.workMode = workMode;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public BigDecimal getMinimumStipend() {
        return minimumStipend;
    }

    public void setMinimumStipend(BigDecimal minimumStipend) {
        this.minimumStipend = minimumStipend;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Boolean getVisaRequired() {
        return visaRequired;
    }

    public void setVisaRequired(Boolean visaRequired) {
        this.visaRequired = visaRequired;
    }

    public Boolean getRelocationPreference() {
        return relocationPreference;
    }

    public void setRelocationPreference(Boolean relocationPreference) {
        this.relocationPreference = relocationPreference;
    }
}
