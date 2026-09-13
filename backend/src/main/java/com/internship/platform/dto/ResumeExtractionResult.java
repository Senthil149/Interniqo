package com.internship.platform.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Deserialised JSON response from the Python AI service's /extract-resume endpoint.
 *
 * All fields are nullable — the AI service returns null for any section it could not
 * detect in the resume.
 *
 * {@code @JsonIgnoreProperties(ignoreUnknown = true)}: the AI service may include
 * extra informational keys (e.g. {@code _note} for scanned-image PDFs) that are not
 * needed here. Ignoring unknown fields prevents deserialization errors if the Python
 * service evolves its response shape.
 *
 * NOTE: these extracted values are a first-pass heuristic and should not be treated
 * as ground-truth profile data without student review.
 * See app/extractor.py in the ai-service for full accuracy caveats.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ResumeExtractionResult {

    private String summary;
    private String skills;
    private String education;
    private String experience;
    private String projects;
    private String certifications;
    private String interests;

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
