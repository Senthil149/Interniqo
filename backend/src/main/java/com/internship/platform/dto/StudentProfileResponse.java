package com.internship.platform.dto;

import com.internship.platform.entity.Student;

/**
 * Read-only snapshot of a student's stored profile fields.
 * Returned by {@code GET /api/student/profile}.
 */
public class StudentProfileResponse {

    private Long id;
    private String skills;
    private String education;
    private String experience;
    private String projects;
    private String certifications;
    private String interests;
    /** Filename only (not full path) to avoid leaking server filesystem layout. */
    private String resumeFileName;

    public static StudentProfileResponse from(Student student) {
        StudentProfileResponse r = new StudentProfileResponse();
        r.setId(student.getId());
        r.setSkills(student.getSkills());
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

    public String getResumeFileName() { return resumeFileName; }
    public void setResumeFileName(String resumeFileName) { this.resumeFileName = resumeFileName; }
}
