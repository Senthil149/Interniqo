package com.internship.platform.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.internship.platform.dto.AdminBlockchainRecordResponse;
import com.internship.platform.dto.AdminCompanyResponse;
import com.internship.platform.dto.AdminEmailVerificationResponse;
import com.internship.platform.dto.AdminFlaggedInternshipResponse;
import com.internship.platform.dto.AdminMetricsResponse;
import com.internship.platform.dto.AdminToggleCompanyVerificationRequest;
import com.internship.platform.dto.AdminUpdateInternshipStatusRequest;
import com.internship.platform.dto.AdminUpdateUserRoleRequest;
import com.internship.platform.dto.AdminUserResponse;
import com.internship.platform.dto.RiskAssessmentResponse;
import com.internship.platform.entity.UserRole;
import com.internship.platform.service.AdminService;
import com.internship.platform.service.RiskAssessmentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final RiskAssessmentService riskAssessmentService;

    public AdminController(AdminService adminService, RiskAssessmentService riskAssessmentService) {
        this.adminService = adminService;
        this.riskAssessmentService = riskAssessmentService;
    }

    /**
     * Get current admin profile.
     */
    @GetMapping("/me")
    public Map<String, String> me(Authentication authentication) {
        return Map.of(
                "role", "ADMIN",
                "email", authentication.getName());
    }

    /**
     * Platform-wide aggregate metrics overview.
     */
    @GetMapping("/metrics")
    public AdminMetricsResponse getMetrics() {
        return adminService.getMetrics();
    }

    /**
     * List users with optional role filtering.
     */
    @GetMapping("/users")
    public List<AdminUserResponse> getUsers(
            @RequestParam(required = false) UserRole role) {
        return adminService.getUsers(role);
    }

    /**
     * Update user role.
     */
    @PutMapping("/users/{id}/role")
    public AdminUserResponse updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRoleRequest request,
            Authentication authentication) {
        return adminService.updateUserRole(id, request.getRole(), authentication.getName());
    }

    /**
     * List companies with statistics, verification status, and domain quality filters.
     */
    @GetMapping("/companies")
    public List<AdminCompanyResponse> getCompanies(
            @RequestParam(required = false) Boolean emailVerified,
            @RequestParam(required = false) Boolean personalEmail,
            @RequestParam(required = false) Boolean websiteMatch,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        if (emailVerified == null && personalEmail == null && websiteMatch == null
                && (search == null || search.isBlank()) && sortBy == null && sortDir == null) {
            return adminService.getCompanies();
        }
        return adminService.getCompanies(emailVerified, personalEmail, websiteMatch, search, sortBy, sortDir);
    }

    /**
     * Override company email verification status.
     */
    @PutMapping("/companies/{id}/verification")
    public AdminCompanyResponse toggleCompanyVerification(
            @PathVariable Long id,
            @Valid @RequestBody AdminToggleCompanyVerificationRequest request) {
        return adminService.toggleCompanyVerification(id, request.getVerified());
    }

    /**
     * List all internships with optional status filtering.
     */
    @GetMapping("/internships")
    public List<AdminFlaggedInternshipResponse> getInternships(
            @RequestParam(required = false) String status) {
        return adminService.getInternships(status);
    }

    /**
     * Update internship listing status (e.g. ACTIVE, CLOSED, SUSPENDED).
     */
    @PutMapping("/internships/{id}/status")
    public AdminFlaggedInternshipResponse updateInternshipStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateInternshipStatusRequest request) {
        return adminService.updateInternshipStatus(id, request.getStatus());
    }

    /**
     * Dedicated review queue for flagged postings (HIGH and MEDIUM risk).
     */
    @GetMapping("/risk/flagged")
    public List<AdminFlaggedInternshipResponse> getFlaggedInternships() {
        return adminService.getFlaggedInternships();
    }

    /**
     * Re-trigger risk analysis on an internship.
     */
    @PostMapping("/risk/analyze/{internshipId}")
    public RiskAssessmentResponse reanalyzeRisk(@PathVariable Long internshipId) {
        return riskAssessmentService.analyzeInternship(internshipId);
    }

    /**
     * Email verification audit trail.
     */
    @GetMapping("/verifications/email")
    public List<AdminEmailVerificationResponse> getEmailVerifications() {
        return adminService.getEmailVerifications();
    }

    /**
     * Blockchain credentials audit trail.
     */
    @GetMapping("/verifications/blockchain")
    public List<AdminBlockchainRecordResponse> getBlockchainRecords() {
        return adminService.getBlockchainRecords();
    }
}
