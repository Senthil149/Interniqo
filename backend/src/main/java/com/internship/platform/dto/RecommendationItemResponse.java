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

    // Explainable AI & Skill-gap fields
    private java.util.List<String> matchingStrengths;
    private java.util.List<String> matchedSkills;
    private java.util.List<String> missingSkills;
    private java.util.List<String> preferenceMatches;
    private String skillGapMessage;
    private String fitLevel;
    private CrossBorderMatchBreakdown crossBorderBreakdown;

    public static RecommendationItemResponse from(Recommendation rec) {
        return from(rec, null, null);
    }

    public static RecommendationItemResponse from(Recommendation rec, com.internship.platform.entity.RiskAssessment risk) {
        return from(rec, risk, null);
    }

    public static RecommendationItemResponse from(
            Recommendation rec,
            com.internship.platform.entity.RiskAssessment risk,
            com.internship.platform.entity.StudentPreference preference) {
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
                resp.setCompanyEmailVerified(in.getCompany().isEmailVerified());
                resp.setCompanyPersonalEmail(in.getCompany().isPersonalEmail());
                resp.setCompanyWebsiteDomainMatch(in.getCompany().isWebsiteDomainMatch());
                resp.setCompanyWebsite(in.getCompany().getWebsite());
                resp.setCompanyVerificationStatus(in.getCompany().getVerificationStatus());
            }
            resp.setCountry(in.getCountry());
            resp.setCity(in.getCity());
            resp.setWorkMode(in.getWorkMode());
            resp.setDuration(in.getDuration());
            resp.setStipend(in.getStipend());
            resp.setCurrency(in.getCurrency());
            resp.setRequiredSkills(in.getRequiredSkills());
            resp.setVisaInformation(in.getVisaInformation());
            resp.setVisaRequired(in.isVisaRequired());
            resp.setRelocationRequired(in.isRelocationRequired());
            resp.setDeadline(in.getDeadline());
            resp.setStatus(in.getStatus());
        }

        if (risk != null) {
            resp.setRiskScore(risk.getScore());
            resp.setRiskLevel(risk.getLevel().name());
            if (risk.getReasons() != null && !risk.getReasons().isBlank()) {
                resp.setRiskReasons(java.util.Arrays.stream(risk.getReasons().split("\n"))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList());
            }
        }

        if (rec.getStudent() != null && rec.getInternship() != null) {
            com.internship.platform.util.SkillAnalysisUtil.AnalysisResult analysis =
                    com.internship.platform.util.SkillAnalysisUtil.analyze(
                            rec.getStudent(), preference, rec.getInternship(), rec.getSimilarityScore());
            resp.setMatchingStrengths(analysis.getMatchingStrengths());
            resp.setMatchedSkills(analysis.getMatchedSkills());
            resp.setMissingSkills(analysis.getMissingSkills());
            resp.setPreferenceMatches(analysis.getPreferenceMatches());
            resp.setSkillGapMessage(analysis.getSkillGapMessage());
            resp.setFitLevel(analysis.getFitLevel());
            resp.setCrossBorderBreakdown(analysis.getCrossBorderBreakdown());
        } else {
            resp.setFitLevel(com.internship.platform.util.SkillAnalysisUtil.getFitLevel(rec.getSimilarityScore()));
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

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public java.util.List<String> getRiskReasons() {
        return riskReasons;
    }

    public void setRiskReasons(java.util.List<String> riskReasons) {
        this.riskReasons = riskReasons;
    }

    public Boolean getCompanyEmailVerified() {
        return companyEmailVerified;
    }

    public void setCompanyEmailVerified(Boolean companyEmailVerified) {
        this.companyEmailVerified = companyEmailVerified;
    }

    public Boolean getCompanyPersonalEmail() {
        return companyPersonalEmail;
    }

    public void setCompanyPersonalEmail(Boolean companyPersonalEmail) {
        this.companyPersonalEmail = companyPersonalEmail;
    }

    public Boolean getCompanyWebsiteDomainMatch() {
        return companyWebsiteDomainMatch;
    }

    public void setCompanyWebsiteDomainMatch(Boolean companyWebsiteDomainMatch) {
        this.companyWebsiteDomainMatch = companyWebsiteDomainMatch;
    }

    public String getCompanyWebsite() {
        return companyWebsite;
    }

    public void setCompanyWebsite(String companyWebsite) {
        this.companyWebsite = companyWebsite;
    }

    public java.util.List<String> getMatchingStrengths() {
        return matchingStrengths;
    }

    public void setMatchingStrengths(java.util.List<String> matchingStrengths) {
        this.matchingStrengths = matchingStrengths;
    }

    public java.util.List<String> getMatchedSkills() {
        return matchedSkills;
    }

    public void setMatchedSkills(java.util.List<String> matchedSkills) {
        this.matchedSkills = matchedSkills;
    }

    public java.util.List<String> getMissingSkills() {
        return missingSkills;
    }

    public void setMissingSkills(java.util.List<String> missingSkills) {
        this.missingSkills = missingSkills;
    }

    public java.util.List<String> getPreferenceMatches() {
        return preferenceMatches;
    }

    public void setPreferenceMatches(java.util.List<String> preferenceMatches) {
        this.preferenceMatches = preferenceMatches;
    }

    public String getSkillGapMessage() {
        return skillGapMessage;
    }

    public void setSkillGapMessage(String skillGapMessage) {
        this.skillGapMessage = skillGapMessage;
    }

    public String getFitLevel() {
        return fitLevel;
    }

    public void setFitLevel(String fitLevel) {
        this.fitLevel = fitLevel;
    }

    public boolean isVisaRequired() {
        return visaRequired;
    }

    public void setVisaRequired(boolean visaRequired) {
        this.visaRequired = visaRequired;
    }

    public boolean isRelocationRequired() {
        return relocationRequired;
    }

    public void setRelocationRequired(boolean relocationRequired) {
        this.relocationRequired = relocationRequired;
    }

    public String getCompanyVerificationStatus() {
        return companyVerificationStatus;
    }

    public void setCompanyVerificationStatus(String companyVerificationStatus) {
        this.companyVerificationStatus = companyVerificationStatus;
    }

    public CrossBorderMatchBreakdown getCrossBorderBreakdown() {
        return crossBorderBreakdown;
    }

    public void setCrossBorderBreakdown(CrossBorderMatchBreakdown crossBorderBreakdown) {
        this.crossBorderBreakdown = crossBorderBreakdown;
    }
}
