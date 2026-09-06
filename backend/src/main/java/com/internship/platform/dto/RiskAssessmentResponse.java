package com.internship.platform.dto;

import com.internship.platform.entity.RiskAssessment;
import com.internship.platform.entity.RiskLevel;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * DTO representing an automated risk assessment report.
 *
 * Design Rule #3: This is an automated warning signal only, never proof of fraud
 * or a guarantee of legitimacy.
 */
public class RiskAssessmentResponse {

    private Long id;
    private Long internshipId;
    private int score;
    private RiskLevel level;
    private List<String> reasons;
    private Instant createdAt;

    public static RiskAssessmentResponse from(RiskAssessment entity) {
        RiskAssessmentResponse resp = new RiskAssessmentResponse();
        resp.setId(entity.getId());
        if (entity.getInternship() != null) {
            resp.setInternshipId(entity.getInternship().getId());
        }
        resp.setScore(entity.getScore());
        resp.setLevel(entity.getLevel());
        resp.setCreatedAt(entity.getCreatedAt());

        if (entity.getReasons() != null && !entity.getReasons().isBlank()) {
            resp.setReasons(Arrays.stream(entity.getReasons().split("\n"))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList());
        } else {
            resp.setReasons(Collections.emptyList());
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

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public RiskLevel getLevel() {
        return level;
    }

    public void setLevel(RiskLevel level) {
        this.level = level;
    }

    public List<String> getReasons() {
        return reasons;
    }

    public void setReasons(List<String> reasons) {
        this.reasons = reasons;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
