package com.internship.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Persists an AI recommendation result for a student and an internship.
 *
 * Design rule #2 compliance: similarity_score stores the raw cosine similarity score
 * returned by the Sentence-BERT /match microservice. It is treated strictly as a
 * ranking signal and is never framed as a percentage match or probability.
 */
@Entity
@Table(name = "recommendations")
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "internship_id", nullable = false)
    private Internship internship;

    @Column(name = "similarity_score", nullable = false)
    private Double similarityScore;

    @Column(name = "ranking", nullable = false)
    private Integer ranking;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Recommendation() {}

    public Recommendation(Student student, Internship internship, Double similarityScore, Integer ranking, Instant createdAt) {
        this.student = student;
        this.internship = internship;
        this.similarityScore = similarityScore;
        this.ranking = ranking;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Internship getInternship() {
        return internship;
    }

    public void setInternship(Internship internship) {
        this.internship = internship;
    }

    public Double getSimilarityScore() {
        return similarityScore;
    }

    public void setSimilarityScore(Double similarityScore) {
        this.similarityScore = similarityScore;
    }

    public Integer getRanking() {
        return ranking;
    }

    public void setRanking(Integer ranking) {
        this.ranking = ranking;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
