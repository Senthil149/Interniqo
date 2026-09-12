package com.internship.platform.dto;

import com.internship.platform.entity.UserRole;

public class RegisterResponse {

    private String email;
    private String name;
    private UserRole role;
    private boolean requiresVerification = true;
    private String message;

    public RegisterResponse() {
    }

    public RegisterResponse(String email, String name, UserRole role, String message) {
        this.email = email;
        this.name = name;
        this.role = role;
        this.requiresVerification = true;
        this.message = message;
    }

    public RegisterResponse(String email, String name, UserRole role, boolean requiresVerification, String message) {
        this.email = email;
        this.name = name;
        this.role = role;
        this.requiresVerification = requiresVerification;
        this.message = message;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public boolean isRequiresVerification() {
        return requiresVerification;
    }

    public void setRequiresVerification(boolean requiresVerification) {
        this.requiresVerification = requiresVerification;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
