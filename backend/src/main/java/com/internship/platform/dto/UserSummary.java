package com.internship.platform.dto;

import com.internship.platform.entity.User;
import com.internship.platform.entity.UserRole;

public class UserSummary {

    private Long id;
    private String name;
    private String email;
    private UserRole role;
    private Boolean emailVerified;
    private Long companyId;

    public static UserSummary from(User user) {
        return from(user, null, null);
    }

    public static UserSummary from(User user, Boolean emailVerified, Long companyId) {
        UserSummary summary = new UserSummary();
        summary.setId(user.getId());
        summary.setName(user.getName());
        summary.setEmail(user.getEmail());
        summary.setRole(user.getRole());
        summary.setEmailVerified(emailVerified);
        summary.setCompanyId(companyId);
        return summary;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public Boolean getEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(Boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }
}
