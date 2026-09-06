package com.internship.platform.dto;

import com.internship.platform.entity.Application;
import com.internship.platform.entity.ApplicationStatus;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.Student;

import java.math.BigDecimal;
import java.time.Instant;

public class ApplicationResponse {

    private Long id;
    private Long internshipId;
    private String internshipTitle;
    private String country;
    private String city;
    private String workMode;
    private String duration;
    private BigDecimal stipend;
    private String currency;

    private Long companyId;
    private String companyName;
    private String companyEmail;
    private boolean companyEmailVerified;

    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String studentEducation;
    private String studentSkills;
    private String studentResumePath;

    private ApplicationStatus status;
    private Instant appliedAt;
    private Instant updatedAt;

    public static ApplicationResponse from(Application app) {
        ApplicationResponse dto = new ApplicationResponse();
        dto.setId(app.getId());
        dto.setStatus(app.getStatus());
        dto.setAppliedAt(app.getAppliedAt());
        dto.setUpdatedAt(app.getUpdatedAt());

        Internship in = app.getInternship();
        if (in != null) {
            dto.setInternshipId(in.getId());
            dto.setInternshipTitle(in.getTitle());
            dto.setCountry(in.getCountry());
            dto.setCity(in.getCity());
            dto.setWorkMode(in.getWorkMode());
            dto.setDuration(in.getDuration());
            dto.setStipend(in.getStipend());
            dto.setCurrency(in.getCurrency());

            Company co = in.getCompany();
            if (co != null) {
                dto.setCompanyId(co.getId());
                dto.setCompanyName(co.getCompanyName());
                dto.setCompanyEmail(co.getEmail());
                dto.setCompanyEmailVerified(co.isEmailVerified());
            }
        }

        Student st = app.getStudent();
        if (st != null) {
            dto.setStudentId(st.getId());
            dto.setStudentEducation(st.getEducation());
            dto.setStudentSkills(st.getSkills());
            dto.setStudentResumePath(st.getResumePath());
            if (st.getUser() != null) {
                dto.setStudentName(st.getUser().getName());
                dto.setStudentEmail(st.getUser().getEmail());
            }
        }

        return dto;
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

    public String getInternshipTitle() {
        return internshipTitle;
    }

    public void setInternshipTitle(String internshipTitle) {
        this.internshipTitle = internshipTitle;
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

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyEmail() {
        return companyEmail;
    }

    public void setCompanyEmail(String companyEmail) {
        this.companyEmail = companyEmail;
    }

    public boolean isCompanyEmailVerified() {
        return companyEmailVerified;
    }

    public void setCompanyEmailVerified(boolean companyEmailVerified) {
        this.companyEmailVerified = companyEmailVerified;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public String getStudentEducation() {
        return studentEducation;
    }

    public void setStudentEducation(String studentEducation) {
        this.studentEducation = studentEducation;
    }

    public String getStudentSkills() {
        return studentSkills;
    }

    public void setStudentSkills(String studentSkills) {
        this.studentSkills = studentSkills;
    }

    public String getStudentResumePath() {
        return studentResumePath;
    }

    public void setStudentResumePath(String studentResumePath) {
        this.studentResumePath = studentResumePath;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }

    public Instant getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(Instant appliedAt) {
        this.appliedAt = appliedAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
