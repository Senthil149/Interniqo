package com.internship.platform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

/**
 * Response DTO for the student recommendation dashboard.
 *
 * Grounding rule: Driven entirely by real database metrics:
 * - Recommendations generated & ranked via Sentence-BERT cosine similarity
 * - Application progress (total applied, shortlisted, accepted)
 * - Saved bookmarks count
 * - Top recommendation previews with explainability and skill-gap breakdowns
 * Zero hardcoded or fabricated demo metrics.
 */
public class StudentRecommendationDashboardResponse {

    @JsonProperty("hasProfile")
    private boolean hasProfile;
    private long totalRecommended;
    private long totalSaved;
    private long totalApplied;
    private long totalShortlisted;
    private long totalAccepted;
    private Double topMatchScore;
    private String topMatchFitLevel;
    private long bestMatchCount;
    private long strongMatchCount;
    private long goodMatchCount;
    private List<RecommendationItemResponse> topRecommendations;
    private Instant lastComputedAt;
    private String summaryMessage;

    public StudentRecommendationDashboardResponse() {}

    public static StudentRecommendationDashboardResponse noProfile(String message) {
        StudentRecommendationDashboardResponse resp = new StudentRecommendationDashboardResponse();
        resp.setHasProfile(false);
        resp.setTotalRecommended(0);
        resp.setTotalSaved(0);
        resp.setTotalApplied(0);
        resp.setTotalShortlisted(0);
        resp.setTotalAccepted(0);
        resp.setTopRecommendations(Collections.emptyList());
        resp.setSummaryMessage(message);
        return resp;
    }

    public static StudentRecommendationDashboardResponse empty(boolean hasProfile, String message) {
        StudentRecommendationDashboardResponse resp = new StudentRecommendationDashboardResponse();
        resp.setHasProfile(hasProfile);
        resp.setTotalRecommended(0);
        resp.setTotalSaved(0);
        resp.setTotalApplied(0);
        resp.setTotalShortlisted(0);
        resp.setTotalAccepted(0);
        resp.setTopRecommendations(Collections.emptyList());
        resp.setSummaryMessage(message);
        return resp;
    }

    @JsonProperty("hasProfile")
    public boolean isHasProfile() {
        return hasProfile;
    }

    @JsonProperty("hasProfile")
    public void setHasProfile(boolean hasProfile) {
        this.hasProfile = hasProfile;
    }

    public long getTotalRecommended() {
        return totalRecommended;
    }

    public void setTotalRecommended(long totalRecommended) {
        this.totalRecommended = totalRecommended;
    }

    public long getTotalSaved() {
        return totalSaved;
    }

    public void setTotalSaved(long totalSaved) {
        this.totalSaved = totalSaved;
    }

    public long getTotalApplied() {
        return totalApplied;
    }

    public void setTotalApplied(long totalApplied) {
        this.totalApplied = totalApplied;
    }

    public long getTotalShortlisted() {
        return totalShortlisted;
    }

    public void setTotalShortlisted(long totalShortlisted) {
        this.totalShortlisted = totalShortlisted;
    }

    public long getTotalAccepted() {
        return totalAccepted;
    }

    public void setTotalAccepted(long totalAccepted) {
        this.totalAccepted = totalAccepted;
    }

    public Double getTopMatchScore() {
        return topMatchScore;
    }

    public void setTopMatchScore(Double topMatchScore) {
        this.topMatchScore = topMatchScore;
    }

    public String getTopMatchFitLevel() {
        return topMatchFitLevel;
    }

    public void setTopMatchFitLevel(String topMatchFitLevel) {
        this.topMatchFitLevel = topMatchFitLevel;
    }

    public long getBestMatchCount() {
        return bestMatchCount;
    }

    public void setBestMatchCount(long bestMatchCount) {
        this.bestMatchCount = bestMatchCount;
    }

    public long getStrongMatchCount() {
        return strongMatchCount;
    }

    public void setStrongMatchCount(long strongMatchCount) {
        this.strongMatchCount = strongMatchCount;
    }

    public long getGoodMatchCount() {
        return goodMatchCount;
    }

    public void setGoodMatchCount(long goodMatchCount) {
        this.goodMatchCount = goodMatchCount;
    }

    public List<RecommendationItemResponse> getTopRecommendations() {
        return topRecommendations;
    }

    public void setTopRecommendations(List<RecommendationItemResponse> topRecommendations) {
        this.topRecommendations = topRecommendations;
    }

    public Instant getLastComputedAt() {
        return lastComputedAt;
    }

    public void setLastComputedAt(Instant lastComputedAt) {
        this.lastComputedAt = lastComputedAt;
    }

    public String getSummaryMessage() {
        return summaryMessage;
    }

    public void setSummaryMessage(String summaryMessage) {
        this.summaryMessage = summaryMessage;
    }
}
