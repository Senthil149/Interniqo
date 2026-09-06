package com.internship.platform.controller;

import com.internship.platform.dto.InternshipResponse;
import com.internship.platform.service.InternshipService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public read-only endpoint — no authentication required.
 * Exposes GET /api/internships/{id} so any visitor can view a posting
 * (e.g. from a shared link) without being logged in.
 */
@RestController
@RequestMapping("/api/internships")
public class PublicInternshipController {

    private final InternshipService internshipService;

    public PublicInternshipController(InternshipService internshipService) {
        this.internshipService = internshipService;
    }

    @GetMapping("/{id}")
    public InternshipResponse getById(@PathVariable Long id) {
        return internshipService.getById(id);
    }
}
