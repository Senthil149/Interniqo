package com.internship.platform.controller;

import com.internship.platform.dto.InternshipResponse;
import com.internship.platform.dto.InternshipSearchParams;
import com.internship.platform.dto.ResumeUploadResponse;
import com.internship.platform.dto.StudentPreferenceRequest;
import com.internship.platform.dto.StudentPreferenceResponse;
import com.internship.platform.dto.StudentProfileResponse;
import com.internship.platform.dto.StudentProfileUpdateRequest;
import com.internship.platform.service.InternshipService;
import com.internship.platform.service.StudentService;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    // ── Resume upload & view ──────────────────────────────────────────────────

    @PostMapping(value = "/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResumeUploadResponse uploadResume(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        return studentService.uploadResume(authentication.getName(), file);
    }

    @GetMapping(value = "/resume", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<Resource> getResume(Authentication authentication) {
        return studentService.getResumeResource(authentication.getName());
    }

    // ── Profile management ────────────────────────────────────────────────────

    @GetMapping("/profile")
    public StudentProfileResponse getProfile(Authentication authentication) {
        return studentService.getProfile(authentication.getName());
    }

    @PutMapping("/profile")
    public StudentProfileResponse updateProfile(
            @RequestBody StudentProfileUpdateRequest request,
            Authentication authentication) {
        return studentService.updateProfile(authentication.getName(), request);
    }

    @PostMapping(value = "/profile/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public StudentProfileResponse uploadProfilePhoto(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        return studentService.uploadProfilePhoto(authentication.getName(), file);
    }

    @DeleteMapping("/profile/photo")
    public StudentProfileResponse removeProfilePhoto(Authentication authentication) {
        return studentService.removeProfilePhoto(authentication.getName());
    }

    @GetMapping("/profile/photo")
    public ResponseEntity<Resource> getProfilePhoto(Authentication authentication) {
        return studentService.getProfilePhotoResource(authentication.getName());
    }

    // ── Preferences ───────────────────────────────────────────────────────────

    @GetMapping("/preferences")
    public StudentPreferenceResponse getPreferences(Authentication authentication) {
        return studentService.getPreferences(authentication.getName());
    }

    @PutMapping("/preferences")
    public StudentPreferenceResponse updatePreferences(
            @RequestBody StudentPreferenceRequest request,
            Authentication authentication) {
        return studentService.updatePreferences(authentication.getName(), request);
    }

    // ── Internship search ─────────────────────────────────────────────────────

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
