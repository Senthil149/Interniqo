package com.internship.platform.controller;

import com.internship.platform.dto.ApplicationResponse;
import com.internship.platform.dto.ApplyRequest;
import com.internship.platform.dto.UpdateApplicationStatusRequest;
import com.internship.platform.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    /**
     * Submit an application to an open internship (Student role).
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse apply(
            @Valid @RequestBody ApplyRequest request,
            Authentication authentication) {
        return applicationService.apply(authentication.getName(), request);
    }

    /**
     * Role-aware listing:
     * - Student: returns their submitted applications.
     * - Company: returns applications to their postings (with optional internshipId filter).
     * - Admin: returns all applications.
     */
    @GetMapping
    public List<ApplicationResponse> getApplications(
            @RequestParam(value = "internshipId", required = false) Long internshipId,
            Authentication authentication) {
        return applicationService.getApplicationsForCurrentUser(authentication.getName(), internshipId);
    }

    /**
     * Check if the authenticated student has already applied to this internship.
     */
    @GetMapping("/check/{internshipId}")
    public ResponseEntity<ApplicationResponse> checkApplication(
            @PathVariable Long internshipId,
            Authentication authentication) {
        return applicationService.checkApplication(authentication.getName(), internshipId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * Update application status (Company or Admin).
     * Enforces company ownership and lifecycle transition rules.
     */
    @PutMapping("/{id}/status")
    public ApplicationResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateApplicationStatusRequest request,
            Authentication authentication) {
        return applicationService.updateStatus(id, authentication.getName(), request);
    }
}
