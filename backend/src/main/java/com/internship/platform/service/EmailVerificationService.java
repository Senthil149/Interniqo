package com.internship.platform.service;

import com.internship.platform.dto.ResendVerificationResponse;
import com.internship.platform.dto.VerifyEmailResponse;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.EmailVerification;
import com.internship.platform.entity.User;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.EmailVerificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Email verification records are owned by either a user or a company, never both or neither.
 *
 * Enforced here instead of a MySQL CHECK (XOR) because: (1) the two nullable FKs serve
 * different flows (account signup vs company inbox proof), and a CHECK would turn a domain
 * rule into an opaque SQL error; (2) callers need a clear validation message that this
 * proves inbox control only, not legal company identity; (3) keeping both columns nullable
 * lets Flyway/FK definitions stay simple and avoids CHECK-support differences across MySQL
 * versions. Always call {@link #assertExactlyOneOwner} before persist/update.
 *
 * Design Rule #4 compliance:
 * Email verification confirms control of the domain inbox only, not legal company identity.
 */
@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    private final EmailVerificationRepository emailVerificationRepository;
    private final CompanyRepository companyRepository;
    private final EmailService emailService;

    public EmailVerificationService(
            EmailVerificationRepository emailVerificationRepository,
            CompanyRepository companyRepository,
            EmailService emailService) {
        this.emailVerificationRepository = emailVerificationRepository;
        this.companyRepository = companyRepository;
        this.emailService = emailService;
    }

    public void assertExactlyOneOwner(EmailVerification verification) {
        if (verification == null) {
            throw new IllegalArgumentException("email verification is required");
        }
        assertExactlyOneOwner(verification.getUser(), verification.getCompany());
    }

    public void assertExactlyOneOwner(User user, Company company) {
        boolean hasUser = user != null;
        boolean hasCompany = company != null;
        if (hasUser == hasCompany) {
            throw new IllegalArgumentException(
                    "email_verifications must set exactly one of user_id or company_id");
        }
    }

    /**
     * Generate a secure token, persist an EmailVerification record with 24-hour expiry,
     * and deliver the verification link via email (or console log).
     */
    @Transactional
    public EmailVerification createAndSendVerification(Company company) {
        if (company == null) {
            throw new IllegalArgumentException("Company cannot be null");
        }

        String token = UUID.randomUUID().toString().replace("-", "") +
                UUID.randomUUID().toString().replace("-", "");
        Instant expiry = Instant.now().plus(24, ChronoUnit.HOURS);

        EmailVerification verification = new EmailVerification();
        verification.setCompany(company);
        verification.setToken(token);
        verification.setExpiry(expiry);

        assertExactlyOneOwner(verification);

        verification = emailVerificationRepository.save(verification);
        log.info("Created verification token for company {} ({}) expiring at {}",
                company.getCompanyName(), company.getEmail(), expiry);

        emailService.sendVerificationEmail(company.getEmail(), company.getCompanyName(), token);
        return verification;
    }

    /**
     * Validate an incoming verification token on click.
     * Enforces expiry check and updates companies.email_verified = true.
     *
     * Design Rule #4: Confirms inbox control only, not legal company identity.
     */
    @Transactional
    public VerifyEmailResponse verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification token is required");
        }

        EmailVerification verification = emailVerificationRepository.findByToken(token.trim())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or unrecognized verification token"));

        String email = verification.getCompany() != null ? verification.getCompany().getEmail() : "Unknown";
        String companyName = verification.getCompany() != null ? verification.getCompany().getCompanyName() : "Company";

        // Check if already verified
        if (verification.getVerifiedAt() != null) {
            return new VerifyEmailResponse(
                    true,
                    "This company email has already been verified.",
                    email,
                    companyName);
        }

        // Check expiry
        if (verification.getExpiry().isBefore(Instant.now())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "This verification link has expired. Please request a new verification email.");
        }

        // Mark as verified
        Instant now = Instant.now();
        verification.setVerifiedAt(now);
        emailVerificationRepository.save(verification);

        if (verification.getCompany() != null) {
            Company company = verification.getCompany();
            company.setEmailVerified(true);
            companyRepository.save(company);
            log.info("Successfully marked email_verified=true for company ID {} ({})",
                    company.getId(), company.getEmail());
        }

        return new VerifyEmailResponse(
                true,
                "Company email verified successfully. This verifies inbox control only, not legal company identity.",
                email,
                companyName);
    }

    /**
     * Re-send a verification email to the given company email address.
     */
    @Transactional
    public ResendVerificationResponse resendVerification(String email) {
        if (email == null || email.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email address is required");
        }

        String normalizedEmail = email.trim().toLowerCase();
        Company company = companyRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "No company account found for email: " + normalizedEmail));

        if (company.isEmailVerified()) {
            return new ResendVerificationResponse(
                    true,
                    "Your company email is already verified. No further action needed.");
        }

        createAndSendVerification(company);

        return new ResendVerificationResponse(
                true,
                "A fresh verification link has been sent to " + normalizedEmail + ". Please check your inbox or server logs.");
    }
}
