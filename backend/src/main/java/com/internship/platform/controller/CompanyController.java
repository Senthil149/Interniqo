package com.internship.platform.controller;

import com.internship.platform.dto.InternshipRequest;
import com.internship.platform.dto.InternshipResponse;
import com.internship.platform.service.InternshipService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/company")
public class CompanyController {

    private final InternshipService internshipService;

    public CompanyController(InternshipService internshipService) {
        this.internshipService = internshipService;
    }

    @GetMapping("/me")
    public Map<String, String> me(Authentication authentication) {
        return Map.of("role", "COMPANY", "email", authentication.getName());
    }

    // ── Internship CRUD ──────────────────────────────────────────────────────

    @PostMapping("/internships")
    @ResponseStatus(HttpStatus.CREATED)
    public InternshipResponse createInternship(
            @Valid @RequestBody InternshipRequest request,
            Authentication authentication) {
        return internshipService.create(authentication.getName(), request);
    }

    @GetMapping("/internships")
    public List<InternshipResponse> myInternships(Authentication authentication) {
        return internshipService.getMyListings(authentication.getName());
    }

    @GetMapping("/internships/{id}")
    public InternshipResponse getInternship(
            @PathVariable Long id,
            Authentication authentication) {
        return internshipService.getByIdForCompany(id, authentication.getName());
    }

    @PutMapping("/internships/{id}")
    public InternshipResponse updateInternship(
            @PathVariable Long id,
            @Valid @RequestBody InternshipRequest request,
            Authentication authentication) {
        return internshipService.update(id, authentication.getName(), request);
    }

    @DeleteMapping("/internships/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteInternship(
            @PathVariable Long id,
            Authentication authentication) {
        internshipService.delete(id, authentication.getName());
    }
}
