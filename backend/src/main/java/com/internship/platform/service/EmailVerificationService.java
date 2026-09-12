package com.internship.platform.service;

import com.internship.platform.dto.ForgotPasswordRequest;
import com.internship.platform.dto.ForgotPasswordResponse;
import com.internship.platform.dto.ResendCodeRequest;
import com.internship.platform.dto.ResendCodeResponse;
import com.internship.platform.dto.ResendVerificationResponse;
import com.internship.platform.dto.ResetPasswordRequest;
import com.internship.platform.dto.ResetPasswordResponse;
import com.internship.platform.dto.VerifyCodeRequest;
import com.internship.platform.dto.VerifyEmailResponse;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.EmailVerification;
import com.internship.platform.entity.User;
import com.internship.platform.entity.UserRole;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.EmailVerificationRepository;
import com.internship.platform.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
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
    private static final String RESET_TOKEN_PREFIX = "reset_";
    private static final int EXPIRY_MINUTES = 10;
    private static final int RATE_LIMIT_SECONDS = 60;

    private final EmailVerificationRepository emailVerificationRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public EmailVerificationService(
            EmailVerificationRepository emailVerificationRepository,
            CompanyRepository companyRepository,
            UserRepository userRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder) {
        this.emailVerificationRepository = emailVerificationRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
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
     * Generate a 6-digit numeric verification code, persist an EmailVerification record with 10-minute expiry,
     * and deliver via email (or console log) for a Company.
     * Enforces a 60-second rate-limit cooldown.
     */
    @Transactional
    public EmailVerification createAndSendVerification(Company company) {
        if (company == null) {
            throw new IllegalArgumentException("Company cannot be null");
        }

        // Rate limit check: 60s cooldown
        Optional<EmailVerification> lastOpt = emailVerificationRepository.findTopByCompanyAndVerifiedAtIsNullOrderByExpiryDesc(company);
        if (lastOpt.isPresent()) {
            EmailVerification last = lastOpt.get();
            if (last.getExpiry() != null) {
                Instant createdAt = last.getExpiry().minus(EXPIRY_MINUTES, ChronoUnit.MINUTES);
                long secondsSinceCreated = ChronoUnit.SECONDS.between(createdAt, Instant.now());
                if (secondsSinceCreated >= 0 && secondsSinceCreated < RATE_LIMIT_SECONDS) {
                    long waitSeconds = RATE_LIMIT_SECONDS - secondsSinceCreated;
                    throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                            "Please wait " + waitSeconds + " seconds before requesting a new verification code.");
                }
            }
        }

        // Clean up unverified verification codes for this company
        List<EmailVerification> existing = emailVerificationRepository.findByCompanyOrderByExpiryDesc(company);
        for (EmailVerification ev : existing) {
            if (ev.getVerifiedAt() == null && ev.getToken() != null && !ev.getToken().startsWith(RESET_TOKEN_PREFIX)) {
                emailVerificationRepository.delete(ev);
            }
        }

        String code;
        do {
            code = String.format("%06d", secureRandom.nextInt(1000000));
        } while (emailVerificationRepository.findByToken(code).isPresent());

        Instant expiry = Instant.now().plus(EXPIRY_MINUTES, ChronoUnit.MINUTES);

        EmailVerification verification = new EmailVerification();
        verification.setCompany(company);
        verification.setToken(code);
        verification.setExpiry(expiry);

        assertExactlyOneOwner(verification);

        verification = emailVerificationRepository.save(verification);
        log.info("Created 6-digit verification code for company {} ({}) expiring at {}",
                company.getCompanyName(), company.getEmail(), expiry);

        emailService.sendVerificationCode(company.getEmail(), company.getCompanyName(), code);
        return verification;
    }

    /**
     * Generate a 6-digit numeric verification code, persist an EmailVerification record with 10-minute expiry,
     * and deliver via email (or console log) for a Student User.
     * Enforces a 60-second rate-limit cooldown.
     */
    @Transactional
    public EmailVerification createAndSendVerification(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }

        // Rate limit check: 60s cooldown
        Optional<EmailVerification> lastOpt = emailVerificationRepository.findTopByUserAndVerifiedAtIsNullOrderByExpiryDesc(user);
        if (lastOpt.isPresent()) {
            EmailVerification last = lastOpt.get();
            if (last.getExpiry() != null) {
                Instant createdAt = last.getExpiry().minus(EXPIRY_MINUTES, ChronoUnit.MINUTES);
                long secondsSinceCreated = ChronoUnit.SECONDS.between(createdAt, Instant.now());
                if (secondsSinceCreated >= 0 && secondsSinceCreated < RATE_LIMIT_SECONDS) {
                    long waitSeconds = RATE_LIMIT_SECONDS - secondsSinceCreated;
                    throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                            "Please wait " + waitSeconds + " seconds before requesting a new verification code.");
                }
            }
        }

        // Clean up unverified verification codes for this user
        List<EmailVerification> existing = emailVerificationRepository.findByUserOrderByExpiryDesc(user);
        for (EmailVerification ev : existing) {
            if (ev.getVerifiedAt() == null && ev.getToken() != null && !ev.getToken().startsWith(RESET_TOKEN_PREFIX)) {
                emailVerificationRepository.delete(ev);
            }
        }

        String code;
        do {
            code = String.format("%06d", secureRandom.nextInt(1000000));
        } while (emailVerificationRepository.findByToken(code).isPresent());

        Instant expiry = Instant.now().plus(EXPIRY_MINUTES, ChronoUnit.MINUTES);

        EmailVerification verification = new EmailVerification();
        verification.setUser(user);
        verification.setToken(code);
        verification.setExpiry(expiry);

        assertExactlyOneOwner(verification);

        verification = emailVerificationRepository.save(verification);
        log.info("Created 6-digit verification code for user {} ({}) expiring at {}",
                user.getName(), user.getEmail(), expiry);

        emailService.sendVerificationCode(user.getEmail(), user.getName(), code);
        return verification;
    }

    /**
     * Generate a 6-digit password reset code with 10-minute expiry, persist in email_verifications table,
     * and deliver via email (or console log).
     */
    @Transactional
    public EmailVerification createAndSendPasswordReset(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }

        // Clean up any unverified reset tokens for this user
        List<EmailVerification> existing = emailVerificationRepository.findByUserOrderByExpiryDesc(user);
        for (EmailVerification ev : existing) {
            if (ev.getVerifiedAt() == null && ev.getToken() != null && ev.getToken().startsWith(RESET_TOKEN_PREFIX)) {
                emailVerificationRepository.delete(ev);
            }
        }

        String code;
        String token;
        do {
            code = String.format("%06d", secureRandom.nextInt(1000000));
            token = RESET_TOKEN_PREFIX + code;
        } while (emailVerificationRepository.findByToken(token).isPresent());

        Instant expiry = Instant.now().plus(EXPIRY_MINUTES, ChronoUnit.MINUTES);

        EmailVerification verification = new EmailVerification();
        verification.setUser(user);
        verification.setToken(token);
        verification.setExpiry(expiry);

        assertExactlyOneOwner(verification);

        verification = emailVerificationRepository.save(verification);
        log.info("Created 6-digit password reset code for user ID {} ({}) expiring at {}",
                user.getId(), user.getEmail(), expiry);

        emailService.sendPasswordResetCode(user.getEmail(), user.getName(), code);
        return verification;
    }

    /**
     * Check if a student user has verified their email address.
     */
    @Transactional(readOnly = true)
    public boolean isUserEmailVerified(User user) {
        if (user == null) {
            return false;
        }
        return emailVerificationRepository.isUserEmailVerified(user);
    }

    /**
     * Validate an incoming verification token on click.
     * Enforces expiry check, ensures reset tokens are rejected, and updates verification status.
     *
     * Design Rule #4: Confirms inbox control only, not legal company or academic identity.
     */
    @Transactional
    public VerifyEmailResponse verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification token is required");
        }

        String trimmedToken = token.trim();
        if (trimmedToken.startsWith(RESET_TOKEN_PREFIX)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid or unrecognized verification token");
        }

        EmailVerification verification = emailVerificationRepository.findByToken(trimmedToken)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or unrecognized verification token"));

        if (verification.getToken() != null && verification.getToken().startsWith(RESET_TOKEN_PREFIX)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid or unrecognized verification token");
        }

        String email = verification.getCompany() != null
                ? verification.getCompany().getEmail()
                : (verification.getUser() != null ? verification.getUser().getEmail() : "Unknown");
        String displayName = verification.getCompany() != null
                ? verification.getCompany().getCompanyName()
                : (verification.getUser() != null ? verification.getUser().getName() : "Account");

        // Check if already verified
        if (verification.getVerifiedAt() != null) {
            return new VerifyEmailResponse(
                    true,
                    "This email has already been verified.",
                    email,
                    displayName);
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
        } else if (verification.getUser() != null) {
            log.info("Successfully verified email for user ID {} ({})",
                    verification.getUser().getId(), verification.getUser().getEmail());
        }

        return new VerifyEmailResponse(
                true,
                "Email verified successfully. This verifies inbox control only, not legal identity.",
                email,
                displayName);
    }

    /**
     * Verify a 6-digit numeric verification code for an account (Student or Company).
     * On success, marks the email as verified and returns the activated User entity.
     */
    @Transactional
    public User verifyCode(VerifyCodeRequest request) {
        if (request == null || request.getEmail() == null || request.getCode() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email and 6-digit verification code are required");
        }

        String email = request.getEmail().trim().toLowerCase();
        String code = request.getCode().trim();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid email or verification code"));

        if (user.getRole() == UserRole.COMPANY) {
            Company company = companyRepository.findByUser(user)
                    .or(() -> companyRepository.findByEmail(email))
                    .orElse(null);
            if (company == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "No company associated with this account");
            }
            if (company.isEmailVerified()) {
                return user;
            }

            EmailVerification verification = emailVerificationRepository.findTopByCompanyAndTokenAndVerifiedAtIsNull(company, code)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid verification code"));

            if (verification.getExpiry().isBefore(Instant.now())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Verification code has expired. Please request a new code.");
            }

            verification.setVerifiedAt(Instant.now());
            emailVerificationRepository.save(verification);

            company.setEmailVerified(true);
            companyRepository.save(company);
            log.info("Successfully verified company email for company ID {} ({})", company.getId(), company.getEmail());
        } else {
            if (isUserEmailVerified(user)) {
                return user;
            }

            EmailVerification verification = emailVerificationRepository.findTopByUserAndTokenAndVerifiedAtIsNull(user, code)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid verification code"));

            if (verification.getExpiry().isBefore(Instant.now())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Verification code has expired. Please request a new code.");
            }

            verification.setVerifiedAt(Instant.now());
            emailVerificationRepository.save(verification);
            log.info("Successfully verified student email for user ID {} ({})", user.getId(), user.getEmail());
        }

        return user;
    }

    /**
     * Re-send a 6-digit verification code to the given student or company email address.
     * Enforces a 60-second rate-limit cooldown.
     */
    @Transactional
    public ResendCodeResponse resendVerificationCode(ResendCodeRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email address is required");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();

        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getRole() == UserRole.STUDENT) {
                if (isUserEmailVerified(user)) {
                    return new ResendCodeResponse(true, "Your student email is already verified. No further action needed.");
                }
                createAndSendVerification(user);
                return new ResendCodeResponse(true, "A verification code has been sent to " + normalizedEmail + ". Please check your inbox.");
            } else if (user.getRole() == UserRole.COMPANY) {
                Company company = companyRepository.findByUser(user)
                        .or(() -> companyRepository.findByEmail(normalizedEmail))
                        .orElse(null);
                if (company != null) {
                    if (company.isEmailVerified()) {
                        return new ResendCodeResponse(true, "Your company email is already verified. No further action needed.");
                    }
                    createAndSendVerification(company);
                    return new ResendCodeResponse(true, "A verification code has been sent to " + normalizedEmail + ". Please check your inbox.");
                }
            }
        }

        Optional<Company> companyOpt = companyRepository.findByEmail(normalizedEmail);
        if (companyOpt.isPresent()) {
            Company company = companyOpt.get();
            if (company.isEmailVerified()) {
                return new ResendCodeResponse(true, "Your company email is already verified. No further action needed.");
            }
            createAndSendVerification(company);
            return new ResendCodeResponse(true, "A verification code has been sent to " + normalizedEmail + ". Please check your inbox.");
        }

        throw new ApiException(HttpStatus.NOT_FOUND, "No account found for email: " + normalizedEmail);
    }

    /**
     * Re-send a verification email to the given student or company email address.
     */
    @Transactional
    public ResendVerificationResponse resendVerification(String email) {
        if (email == null || email.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email address is required");
        }

        String normalizedEmail = email.trim().toLowerCase();

        // 1. Check user account
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getRole() == UserRole.STUDENT) {
                if (isUserEmailVerified(user)) {
                    return new ResendVerificationResponse(
                            true,
                            "Your student email is already verified. No further action needed.");
                }
                createAndSendVerification(user);
                return new ResendVerificationResponse(
                        true,
                        "A fresh verification code has been sent to " + normalizedEmail + ". Please check your inbox or server logs.");
            } else if (user.getRole() == UserRole.COMPANY) {
                Company company = companyRepository.findByUser(user)
                        .or(() -> companyRepository.findByEmail(normalizedEmail))
                        .orElse(null);
                if (company != null) {
                    if (company.isEmailVerified()) {
                        return new ResendVerificationResponse(
                                true,
                                "Your company email is already verified. No further action needed.");
                    }
                    createAndSendVerification(company);
                    return new ResendVerificationResponse(
                            true,
                            "A fresh verification code has been sent to " + normalizedEmail + ". Please check your inbox or server logs.");
                }
            }
        }

        // 2. Direct fallback for company repository (e.g. legacy or slice tests)
        Optional<Company> companyOpt = companyRepository.findByEmail(normalizedEmail);
        if (companyOpt.isPresent()) {
            Company company = companyOpt.get();
            if (company.isEmailVerified()) {
                return new ResendVerificationResponse(
                        true,
                        "Your company email is already verified. No further action needed.");
            }
            createAndSendVerification(company);
            return new ResendVerificationResponse(
                    true,
                    "A fresh verification code has been sent to " + normalizedEmail + ". Please check your inbox or server logs.");
        }

        throw new ApiException(HttpStatus.NOT_FOUND, "No account found for email: " + normalizedEmail);
    }

    /**
     * Request a password reset link.
     * Always returns generic success response to prevent email enumeration.
     */
    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email address is required");
        }

        String email = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            createAndSendPasswordReset(userOpt.get());
        } else {
            log.info("Password reset requested for non-existent email: {}", email);
        }

        return new ForgotPasswordResponse(
                true,
                "If an account with that email exists, we have sent a 6-digit password reset code. Please check your inbox or server logs.");
    }

    /**
     * Consume a 6-digit password reset code (or reset token) and update user password.
     */
    @Transactional
    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        String codeOrToken = request.getCode();
        if (codeOrToken == null || codeOrToken.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reset code is required");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
        }

        String trimmed = codeOrToken.trim();
        String token = trimmed.startsWith(RESET_TOKEN_PREFIX) ? trimmed : RESET_TOKEN_PREFIX + trimmed;

        EmailVerification verification;
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String email = request.getEmail().trim().toLowerCase();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid reset code or email"));
            verification = emailVerificationRepository.findTopByUserAndTokenAndVerifiedAtIsNull(user, token)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired password reset code"));
        } else {
            verification = emailVerificationRepository.findByToken(token)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or unrecognized password reset code"));
        }

        if (verification.getVerifiedAt() != null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This password reset code has already been used");
        }

        if (verification.getExpiry().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This password reset code has expired. Please request a new one.");
        }

        User user = verification.getUser();
        if (user == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No user associated with this reset code");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        verification.setVerifiedAt(Instant.now());
        emailVerificationRepository.save(verification);

        log.info("Successfully reset password for user ID {} ({})", user.getId(), user.getEmail());

        return new ResetPasswordResponse(
                true,
                "Password has been reset successfully. You can now sign in with your new password.");
    }
}
