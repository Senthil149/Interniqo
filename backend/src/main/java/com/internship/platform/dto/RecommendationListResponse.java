package com.internship.platform.dto;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

public class RecommendationListResponse {

    private boolean hasProfile;
    private String message;
    private List<RecommendationItemResponse> recommendations;
    private Instant generatedAt;

    public RecommendationListResponse() {
        this.recommendations = Collections.emptyList();
    }

    public RecommendationListResponse(boolean hasProfile, String message, List<RecommendationItemResponse> recommendations, Instant generatedAt) {
        this.hasProfile = hasProfile;
        this.message = message;
        this.recommendations = recommendations != null ? recommendations : Collections.emptyList();
        this.generatedAt = generatedAt;
    }

    public static RecommendationListResponse noProfile(String message) {
        return new RecommendationListResponse(false, message, Collections.emptyList(), null);
    }

    public static RecommendationListResponse success(List<RecommendationItemResponse> recommendations, Instant generatedAt) {
        return new RecommendationListResponse(true, null, recommendations, generatedAt);
    }

    public static RecommendationListResponse empty(String message) {
        return new RecommendationListResponse(true, message, Collections.emptyList(), Instant.now());
    }

    public boolean isHasProfile() {
        return hasProfile;
    }

    public void setHasProfile(boolean hasProfile) {
        this.hasProfile = hasProfile;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<RecommendationItemResponse> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<RecommendationItemResponse> recommendations) {
        this.recommendations = recommendations;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Instant generatedAt) {
        this.generatedAt = generatedAt;
    }
}
