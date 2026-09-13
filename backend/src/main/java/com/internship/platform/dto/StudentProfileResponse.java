package com.internship.platform.dto;

import com.internship.platform.entity.Student;
import com.internship.platform.util.SkillAnalysisUtil;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Snapshot of a student's stored profile fields.
 * Returned by {@code GET /api/student/profile} and {@code PUT /api/student/profile}.
 */
public class StudentProfileResponse {

    private Long id;
    private String name;
    private String email;
    private String professionalHeadline;
    private String location;
    private String college;
    private String bio;
    private String skills;
    private List<String> skillList;
    private String profilePhotoUrl;
    private String githubUrl;
    private String linkedinUrl;
    private String portfolioUrl;
    /** Filename only (not full path) to avoid leaking server filesystem layout. */
    private String resumeFileName;

    // Extracted sections preserved for backward compatibility
    private String summary;
    private String education;
    private String experience;
    private String projects;
    private String certifications;
    private String interests;

    public static StudentProfileResponse from(Student student) {
        StudentProfileResponse r = new StudentProfileResponse();
        r.setId(student.getId());
        if (student.getUser() != null) {
            r.setName(student.getUser().getName());
            r.setEmail(student.getUser().getEmail());
        }
        r.setProfessionalHeadline(student.getProfessionalHeadline());
        r.setLocation(student.getLocation());
        r.setCollege(student.getCollege());
        r.setBio(student.getBio() != null ? student.getBio() : student.getSummary());
        r.setSkills(student.getSkills());

        if (student.getSkills() != null && !student.getSkills().isBlank()) {
            r.setSkillList(new ArrayList<>(SkillAnalysisUtil.extractSkills(student.getSkills())));
        } else {
            r.setSkillList(Collections.emptyList());
        }

        r.setProfilePhotoUrl(student.getProfilePhotoUrl());
        r.setGithubUrl(student.getGithubUrl());
        r.setLinkedinUrl(student.getLinkedinUrl());
        r.setPortfolioUrl(student.getPortfolioUrl());

        // Preserved backward-compatible fields
        r.setSummary(student.getSummary());
        r.setEducation(student.getEducation());
        r.setExperience(student.getExperience());
        r.setProjects(student.getProjects());
        r.setCertifications(student.getCertifications());
        r.setInterests(student.getInterests());

        // Expose only the filename, not the full server-side path
        if (student.getResumePath() != null) {
            String path = student.getResumePath().replace('\\', '/');
            r.setResumeFileName(path.substring(path.lastIndexOf('/') + 1));
        }
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getProfessionalHeadline() { return professionalHeadline; }
    public void setProfessionalHeadline(String professionalHeadline) { this.professionalHeadline = professionalHeadline; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public List<String> getSkillList() { return skillList; }
    public void setSkillList(List<String> skillList) { this.skillList = skillList; }

    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }

    public String getGithubUrl() { return githubUrl; }
    public void setGithubUrl(String githubUrl) { this.githubUrl = githubUrl; }

    public String getLinkedinUrl() { return linkedinUrl; }
    public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }

    public String getPortfolioUrl() { return portfolioUrl; }
    public void setPortfolioUrl(String portfolioUrl) { this.portfolioUrl = portfolioUrl; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

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

    public String getResumeFileName() { return resumeFileName; }
    public void setResumeFileName(String resumeFileName) { this.resumeFileName = resumeFileName; }
}
