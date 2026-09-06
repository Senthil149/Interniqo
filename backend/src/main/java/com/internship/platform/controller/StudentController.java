package com.internship.platform.controller;

import com.internship.platform.dto.InternshipResponse;
import com.internship.platform.dto.InternshipSearchParams;
import com.internship.platform.dto.ResumeUploadResponse;
import com.internship.platform.dto.StudentProfileResponse;
import com.internship.platform.service.InternshipService;
import com.internship.platform.service.StudentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final InternshipService internshipService;
    private final StudentService studentService;

    public StudentController(InternshipService internshipService, StudentService studentService) {
        this.internshipService = internshipService;
        this.studentService = studentService;
    }

    @GetMapping("/me")
    public Map<String, String> me(Authentication authentication) {
        return Map.of("role", "STUDENT", "email", authentication.getName());
    }

    // ── Resume upload ─────────────────────────────────────────────────────────

    /**
     * Accept a PDF resume upload, store it, and call the Python AI service to
     * extract structured profile sections.
     *
     * File constraints enforced here and in {@link StudentService}:
     *   - Content-type: application/pdf
     *   - Extension: .pdf
     *   - Max size: 5 MB
     *
     * If the AI service is unavailable the upload still succeeds;
     * {@code aiExtractionSucceeded} will be {@code false} in the response.
     */
    @PostMapping(value = "/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResumeUploadResponse uploadResume(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        return studentService.uploadResume(authentication.getName(), file);
    }

    /**
     * Return the current student profile fields (extracted on last resume upload).
     * Used by the frontend to show existing data before a new upload.
     */
    @GetMapping("/profile")
    public StudentProfileResponse getProfile(Authentication authentication) {
        return studentService.getProfile(authentication.getName());
    }

    // ── Internship search ─────────────────────────────────────────────────────

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
