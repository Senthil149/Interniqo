package com.internship.platform.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.internship.platform.dto.AuthResponse;
import com.internship.platform.dto.ForgotPasswordRequest;
import com.internship.platform.dto.ForgotPasswordResponse;
import com.internship.platform.dto.LoginRequest;
import com.internship.platform.dto.RefreshRequest;
import com.internship.platform.dto.RegisterRequest;
import com.internship.platform.dto.RegisterResponse;
import com.internship.platform.dto.ResendCodeRequest;
import com.internship.platform.dto.ResendCodeResponse;
import com.internship.platform.dto.ResendVerificationRequest;
import com.internship.platform.dto.ResendVerificationResponse;
import com.internship.platform.dto.ResetPasswordRequest;
import com.internship.platform.dto.ResetPasswordResponse;
import com.internship.platform.dto.UserSummary;
import com.internship.platform.dto.VerifyCodeRequest;
import com.internship.platform.dto.VerifyEmailResponse;
import com.internship.platform.service.AuthService;
import com.internship.platform.service.EmailVerificationService;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;

    public AuthController(AuthService authService, EmailVerificationService emailVerificationService) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/verify-code")
    public AuthResponse verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        return authService.verifyCode(request);
    }

    @PostMapping("/resend-code")
    public ResendCodeResponse resendCode(@Valid @RequestBody ResendCodeRequest request) {
        return authService.resendCode(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.getRefreshToken());
    }

    @GetMapping("/me")
    public UserSummary me(Authentication authentication) {
        return authService.me(authentication.getName());
    }

    /**
     * Validate verification token from email link click.
     * Publicly accessible per API plan.
     *
     * Design Rule #4: Confirms inbox control only, not legal company identity.
     */
    @GetMapping("/verify-email")
    public VerifyEmailResponse verifyEmail(@RequestParam("token") String token) {
        return emailVerificationService.verifyEmail(token);
    }

    /**
     * Re-send a verification email to a company inbox.
     * If user is authenticated as company, defaults to current company email.
     */
    @PostMapping("/resend-verification")
    public ResendVerificationResponse resendVerification(
            @RequestBody(required = false) ResendVerificationRequest request,
            Authentication authentication) {
        String email = null;
        if (request != null && request.getEmail() != null && !request.getEmail().isBlank()) {
            email = request.getEmail().trim();
        } else if (authentication != null && authentication.getName() != null) {
            email = authentication.getName();
        }
        return emailVerificationService.resendVerification(email);
    }

    /**
     * Request password reset link.
     * Always returns generic success response to prevent email enumeration.
     */
    @PostMapping("/forgot-password")
    public ForgotPasswordResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request);
    }

    /**
     * Reset password using secure token.
     */
    @PostMapping("/reset-password")
    public ResetPasswordResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }
}
