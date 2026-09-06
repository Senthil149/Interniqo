package com.internship.platform.controller;

import com.internship.platform.dto.InternshipResponse;
import com.internship.platform.dto.InternshipSearchParams;
import com.internship.platform.service.InternshipService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final InternshipService internshipService;

    public StudentController(InternshipService internshipService) {
        this.internshipService = internshipService;
    }

    @GetMapping("/me")
    public Map<String, String> me(Authentication authentication) {
        return Map.of("role", "STUDENT", "email", authentication.getName());
    }

    // ── Internship search ────────────────────────────────────────────────────

    /**
     * Cross-border search with mandatory structured filters applied server-side.
     * Filter params are bound via @ModelAttribute from query string.
     * Pagination params (page, size, sort) are bound automatically by Spring.
     * No semantic ranking — this is Phase 4 (filters only).
     */
    @GetMapping("/internships")
    public Page<InternshipResponse> searchInternships(
            @ModelAttribute InternshipSearchParams params,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return internshipService.search(params, pageable);
    }

    @GetMapping("/internships/{id}")
    public InternshipResponse getInternship(@PathVariable Long id) {
        return internshipService.getById(id);
    }
}
