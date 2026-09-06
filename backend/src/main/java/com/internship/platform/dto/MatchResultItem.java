package com.internship.platform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class MatchResultItem {

    private Long id;

    @JsonProperty("similarity_score")
    private Double similarityScore;

    public MatchResultItem() {}

    public MatchResultItem(Long id, Double similarityScore) {
        this.id = id;
        this.similarityScore = similarityScore;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getSimilarityScore() {
        return similarityScore;
    }

    public void setSimilarityScore(Double similarityScore) {
        this.similarityScore = similarityScore;
    }
}
