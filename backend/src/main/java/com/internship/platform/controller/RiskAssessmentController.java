package com.internship.platform.controller;

import com.internship.platform.dto.RiskAssessmentResponse;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.User;
import com.internship.platform.entity.UserRole;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.InternshipRepository;
import com.internship.platform.repository.UserRepository;
import com.internship.platform.service.RiskAssessmentService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller exposing endpoints for automated risk assessment reports:
 *
 * POST /api/risk/analyze/{internshipId} — Trigger / re-analyze risk (Company owner or Admin)
 * GET  /api/risk/{internshipId}         — View risk report (Authenticated users)
 *
 * Design Rule #3: Output represents an automated warning signal, not proof of fraud.
 */
@RestController
@RequestMapping("/api/risk")
public class RiskAssessmentController {

    private final RiskAssessmentService riskAssessmentService;
    private final InternshipRepository internshipRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    public RiskAssessmentController(
            RiskAssessmentService riskAssessmentService,
            InternshipRepository internshipRepository,
            UserRepository userRepository,
            CompanyRepository companyRepository) {
        this.riskAssessmentService = riskAssessmentService;
        this.internshipRepository = internshipRepository;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
    }

    /**
     * Re-trigger risk assessment analysis on an internship.
     * Accessible by the company that owns the internship or an ADMIN.
     */
    @PostMapping("/analyze/{internshipId}")
    public RiskAssessmentResponse analyzeRisk(
            @PathVariable Long internshipId,
            Authentication authentication) {
        Internship internship = internshipRepository.findById(internshipId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (user.getRole() == UserRole.COMPANY) {
            Company company = companyRepository.findByUser(user)
                    .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Company profile not found"));
            if (!internship.getCompany().getId().equals(company.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to analyze this internship");
            }
        } else if (user.getRole() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only company owners or admins may trigger risk analysis");
        }

        return riskAssessmentService.analyzeInternship(internshipId);
    }

    /**
     * Get the current risk assessment for an internship.
     * Accessible to all authenticated users (students reviewing postings, companies, admins).
     */
    @GetMapping("/{internshipId}")
    public RiskAssessmentResponse getRiskAssessment(@PathVariable Long internshipId) {
        return riskAssessmentService.getAssessment(internshipId);
    }
}
