package com.internship.platform.dto;

import com.internship.platform.entity.Internship;
import com.internship.platform.entity.Recommendation;

import java.math.BigDecimal;
import java.time.LocalDate;

public class RecommendationItemResponse {

    private Long id;
    private Long internshipId;
    private Integer ranking;
    private Double similarityScore;
    private String title;
    private String companyName;
    private String country;
    private String city;
    private String workMode;
    private String duration;
    private BigDecimal stipend;
    private String currency;
    private String requiredSkills;
    private String visaInformation;
    private LocalDate deadline;
    private String status;

    public static RecommendationItemResponse from(Recommendation rec) {
        RecommendationItemResponse resp = new RecommendationItemResponse();
        resp.setId(rec.getId());
        resp.setRanking(rec.getRanking());
        resp.setSimilarityScore(rec.getSimilarityScore());

        Internship in = rec.getInternship();
        if (in != null) {
            resp.setInternshipId(in.getId());
            resp.setTitle(in.getTitle());
            if (in.getCompany() != null) {
                resp.setCompanyName(in.getCompany().getCompanyName());
            }
            resp.setCountry(in.getCountry());
            resp.setCity(in.getCity());
            resp.setWorkMode(in.getWorkMode());
            resp.setDuration(in.getDuration());
            resp.setStipend(in.getStipend());
            resp.setCurrency(in.getCurrency());
            resp.setRequiredSkills(in.getRequiredSkills());
            resp.setVisaInformation(in.getVisaInformation());
            resp.setDeadline(in.getDeadline());
            resp.setStatus(in.getStatus());
        }
        return resp;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getInternshipId() {
        return internshipId;
    }

    public void setInternshipId(Long internshipId) {
        this.internshipId = internshipId;
    }

    public Integer getRanking() {
        return ranking;
    }

    public void setRanking(Integer ranking) {
        this.ranking = ranking;
    }

    public Double getSimilarityScore() {
        return similarityScore;
    }

    public void setSimilarityScore(Double similarityScore) {
        this.similarityScore = similarityScore;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
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

    public BigDecimal getStipend() {
        return stipend;
    }

    public void setStipend(BigDecimal stipend) {
        this.stipend = stipend;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getRequiredSkills() {
        return requiredSkills;
    }

    public void setRequiredSkills(String requiredSkills) {
        this.requiredSkills = requiredSkills;
    }

    public String getVisaInformation() {
        return visaInformation;
    }

    public void setVisaInformation(String visaInformation) {
        this.visaInformation = visaInformation;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
