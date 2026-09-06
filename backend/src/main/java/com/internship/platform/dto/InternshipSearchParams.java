package com.internship.platform.dto;

import java.math.BigDecimal;

/**
 * Holds optional filter parameters for the student internship search.
 * All fields are nullable; a null value means "do not filter on this dimension".
 * Bound from HTTP query params via {@code @ModelAttribute} in StudentController.
 */
public class InternshipSearchParams {

    private String keyword;
    private String country;
    private String city;
    private String workMode;
    private String duration;
    private BigDecimal minStipend;
    private String currency;
    /**
     * When true, only internships that have visaInformation provided are returned —
     * i.e., the company has described visa support. Does not guarantee visa sponsorship.
     */
    private Boolean visaRequired;

    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getWorkMode() { return workMode; }
    public void setWorkMode(String workMode) { this.workMode = workMode; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public BigDecimal getMinStipend() { return minStipend; }
    public void setMinStipend(BigDecimal minStipend) { this.minStipend = minStipend; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public Boolean getVisaRequired() { return visaRequired; }
    public void setVisaRequired(Boolean visaRequired) { this.visaRequired = visaRequired; }
}
