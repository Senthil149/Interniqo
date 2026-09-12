package com.internship.platform.dto;

public class CompanyProfileRequest {

    private String companyName;
    private String website;
    private String country;
    private String description;

    public CompanyProfileRequest() {
    }

    public CompanyProfileRequest(String companyName, String website, String country, String description) {
        this.companyName = companyName;
        this.website = website;
        this.country = country;
        this.description = description;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
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
}
