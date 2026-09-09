package com.internship.platform.dto;

import com.internship.platform.entity.UserRole;
import jakarta.validation.constraints.NotNull;

public class AdminUpdateUserRoleRequest {

    @NotNull(message = "role is required")
    private UserRole role;

    public AdminUpdateUserRoleRequest() {
    }

    public AdminUpdateUserRoleRequest(UserRole role) {
        this.role = role;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }
}
