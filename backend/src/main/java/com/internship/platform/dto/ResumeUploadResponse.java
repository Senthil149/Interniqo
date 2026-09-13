package com.internship.platform.dto;

/**
 * Response body for {@code POST /api/student/resume}.
 *
 * Contains the stored file path and the structured fields extracted by the
 * Python AI service.  If the AI service was unavailable at upload time,
 * {@code aiExtractionSucceeded} is {@code false} and all extracted fields
 * are {@code null} — the upload itself still succeeds.
 */
public class ResumeUploadResponse {

    private String resumePath;
    /** True only when the Python AI service responded with HTTP 2xx. */
    private boolean aiExtractionSucceeded;
    private String summary;
    private String skills;
    private String education;
    private String experience;
    private String projects;
    private String certifications;
    private String interests;

    public String getResumePath() { return resumePath; }
    public void setResumePath(String resumePath) { this.resumePath = resumePath; }

    public boolean isAiExtractionSucceeded() { return aiExtractionSucceeded; }
    public void setAiExtractionSucceeded(boolean aiExtractionSucceeded) {
        this.aiExtractionSucceeded = aiExtractionSucceeded;
    }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }

    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }

    public String getProjects() { return projects; }
    public void setProjects(String projects) { this.projects = projects; }

    public String getCertifications() { return certifications; }
    public void setCertifications(String certifications) { this.certifications = certifications; }

    public String getInterests() { return interests; }
    public void setInterests(String interests) { this.interests = interests; }
}
