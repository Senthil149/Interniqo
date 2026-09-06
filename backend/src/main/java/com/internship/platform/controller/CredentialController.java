package com.internship.platform.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.internship.platform.dto.CredentialResponse;
import com.internship.platform.dto.IssueCredentialRequest;
import com.internship.platform.dto.PublicVerifyResponse;
import com.internship.platform.service.CredentialService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/credentials")
public class CredentialController {

    private final CredentialService credentialService;

    public CredentialController(CredentialService credentialService) {
        this.credentialService = credentialService;
    }

    /**
     * Issue a blockchain credential for a COMPLETED internship application.
     * Restricted to ROLE_COMPANY in SecurityConfig.
     */
    @PostMapping("/issue")
    @ResponseStatus(HttpStatus.CREATED)
    public CredentialResponse issueCredential(
            @Valid @RequestBody IssueCredentialRequest request,
            Authentication authentication) {
        return credentialService.issueCredential(request, authentication.getName());
    }

    /**
     * Public credential verification endpoint.
     * Accessible by anyone without login per project specification.
     */
    @GetMapping("/verify/{credentialId}")
    public PublicVerifyResponse verifyCredential(@PathVariable String credentialId) {
        return credentialService.verifyCredential(credentialId);
    }

    /**
     * Retrieve credentials belonging to the currently authenticated user.
     * If user is a student, returns credentials awarded to them.
     * If user is a company, returns credentials issued by them.
     */
    @GetMapping("/my")
    public List<CredentialResponse> getMyCredentials(Authentication authentication) {
        boolean isCompany = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_COMPANY"));

        if (isCompany) {
            return credentialService.getCompanyCredentials(authentication.getName());
        } else {
            return credentialService.getStudentCredentials(authentication.getName());
        }
    }

    /**
     * Get specific credential detail by ID.
     */
    @GetMapping("/{credentialId}")
    public CredentialResponse getCredentialById(@PathVariable String credentialId) {
        return credentialService.getCredentialById(credentialId);
    }
}
