package com.internship.platform.dto;

import com.internship.platform.entity.StudentPreference;

import java.math.BigDecimal;

public class StudentPreferenceResponse {

    private Long id;
    private Long studentId;
    private String country;
    private String preferredCountries;
    private String location;
    private String workMode;
    private String duration;
    private BigDecimal minimumStipend;
    private String currency;
    private boolean visaRequired;
    private boolean relocationPreference;

    public static StudentPreferenceResponse from(StudentPreference pref) {
        if (pref == null) return null;
        StudentPreferenceResponse resp = new StudentPreferenceResponse();
        resp.setId(pref.getId());
        if (pref.getStudent() != null) {
            resp.setStudentId(pref.getStudent().getId());
        }
        resp.setCountry(pref.getCountry());
        resp.setPreferredCountries(pref.getPreferredCountries());
        resp.setLocation(pref.getLocation());
        resp.setWorkMode(pref.getWorkMode());
        resp.setDuration(pref.getDuration());
        resp.setMinimumStipend(pref.getMinimumStipend());
        resp.setCurrency(pref.getCurrency());
        resp.setVisaRequired(pref.isVisaRequired());
        resp.setRelocationPreference(pref.isRelocationPreference());
        return resp;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

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

    public boolean isVisaRequired() {
        return visaRequired;
    }

    public void setVisaRequired(boolean visaRequired) {
        this.visaRequired = visaRequired;
    }

    public boolean isRelocationPreference() {
        return relocationPreference;
    }

    public void setRelocationPreference(boolean relocationPreference) {
        this.relocationPreference = relocationPreference;
    }
}
