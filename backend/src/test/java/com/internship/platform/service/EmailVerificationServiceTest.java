package com.internship.platform.service;

import com.internship.platform.dto.ForgotPasswordRequest;
import com.internship.platform.dto.ForgotPasswordResponse;
import com.internship.platform.dto.ResendVerificationResponse;
import com.internship.platform.dto.ResetPasswordRequest;
import com.internship.platform.dto.ResetPasswordResponse;
import com.internship.platform.dto.VerifyEmailResponse;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.EmailVerification;
import com.internship.platform.entity.User;
import com.internship.platform.entity.UserRole;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.EmailVerificationRepository;
import com.internship.platform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock
    private EmailVerificationRepository emailVerificationRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private EmailVerificationService emailVerificationService;

    private Company company;
    private User studentUser;

    @BeforeEach
    void setUp() {
        company = new Company();
        company.setId(10L);
        company.setCompanyName("Acme Global");
        company.setEmail("careers@acme-global.org");
        company.setEmailVerified(false);

        studentUser = new User();
        studentUser.setId(1L);
        studentUser.setName("Bob Student");
        studentUser.setEmail("bob@student.edu");
        studentUser.setRole(UserRole.STUDENT);
        studentUser.setPasswordHash("hashed_old_password");
    }

    @Test
    @DisplayName("assertExactlyOneOwner enforces mutual exclusion between User and Company")
    void assertExactlyOneOwnerValidation() {
        User user = new User();
        user.setId(1L);

        // Neither -> error
        assertThrows(IllegalArgumentException.class, () ->
                emailVerificationService.assertExactlyOneOwner(null, null));

        // Both -> error
        assertThrows(IllegalArgumentException.class, () ->
                emailVerificationService.assertExactlyOneOwner(user, company));

        // User only -> OK
        assertDoesNotThrow(() ->
                emailVerificationService.assertExactlyOneOwner(user, null));

        // Company only -> OK
        assertDoesNotThrow(() ->
                emailVerificationService.assertExactlyOneOwner(null, company));
    }

    @Test
    @DisplayName("createAndSendVerification creates a 10-minute 6-digit code, saves record, and calls EmailService for company")
    void createAndSendVerificationCompanySuccess() {
        when(emailVerificationRepository.save(any(EmailVerification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        EmailVerification verification = emailVerificationService.createAndSendVerification(company);

        assertNotNull(verification);
        assertNotNull(verification.getToken());
        assertEquals(6, verification.getToken().length());
        assertTrue(verification.getToken().matches("\\d{6}"));
        assertEquals(company, verification.getCompany());
        assertNull(verification.getUser());
        assertNull(verification.getVerifiedAt());

        // Expiry should be approximately 10 minutes in the future
        Instant minExpected = Instant.now().plus(9, ChronoUnit.MINUTES);
        Instant maxExpected = Instant.now().plus(11, ChronoUnit.MINUTES);
        assertTrue(verification.getExpiry().isAfter(minExpected));
        assertTrue(verification.getExpiry().isBefore(maxExpected));

        verify(emailService, times(1)).sendVerificationCode(
                eq(company.getEmail()), eq(company.getCompanyName()), eq(verification.getToken()));
    }

    @Test
    @DisplayName("createAndSendVerification creates a 10-minute 6-digit code, saves record, and calls EmailService for student user")
    void createAndSendVerificationStudentSuccess() {
        when(emailVerificationRepository.save(any(EmailVerification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        EmailVerification verification = emailVerificationService.createAndSendVerification(studentUser);

        assertNotNull(verification);
        assertNotNull(verification.getToken());
        assertEquals(6, verification.getToken().length());
        assertTrue(verification.getToken().matches("\\d{6}"));
        assertEquals(studentUser, verification.getUser());
        assertNull(verification.getCompany());
        assertNull(verification.getVerifiedAt());

        Instant minExpected = Instant.now().plus(9, ChronoUnit.MINUTES);
        assertTrue(verification.getExpiry().isAfter(minExpected));

        verify(emailService, times(1)).sendVerificationCode(
                eq(studentUser.getEmail()), eq(studentUser.getName()), eq(verification.getToken()));
    }

    @Test
    @DisplayName("createAndSendVerification enforces 60-second rate limit cooldown")
    void createAndSendVerification_rateLimited_throws429() {
        EmailVerification activeVer = new EmailVerification();
        activeVer.setToken("123456");
        activeVer.setCompany(company);
        // Created 30 seconds ago -> expiry is in 9.5 minutes
        activeVer.setExpiry(Instant.now().plus(9, ChronoUnit.MINUTES).plus(30, ChronoUnit.SECONDS));

        when(emailVerificationRepository.findTopByCompanyAndVerifiedAtIsNullOrderByExpiryDesc(company))
                .thenReturn(Optional.of(activeVer));

        ApiException ex = assertThrows(ApiException.class, () ->
                emailVerificationService.createAndSendVerification(company));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
        assertTrue(ex.getMessage().contains("Please wait"));
        verify(emailVerificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("verifyEmail successfully verifies valid token, marks company email_verified=true, and complies with Design Rule #4")
    void verifyEmailCompanySuccess() {
        String token = "valid-token-12345";
        EmailVerification verification = new EmailVerification();
        verification.setToken(token);
        verification.setCompany(company);
        verification.setExpiry(Instant.now().plus(12, ChronoUnit.HOURS));
        verification.setVerifiedAt(null);

        when(emailVerificationRepository.findByToken(token)).thenReturn(Optional.of(verification));
        when(emailVerificationRepository.save(any(EmailVerification.class))).thenAnswer(inv -> inv.getArgument(0));
        when(companyRepository.save(any(Company.class))).thenAnswer(inv -> inv.getArgument(0));

        VerifyEmailResponse response = emailVerificationService.verifyEmail(token);

        assertTrue(response.isVerified());
        assertEquals("careers@acme-global.org", response.getEmail());
        assertEquals("Acme Global", response.getCompanyName());
        assertTrue(company.isEmailVerified(), "Company emailVerified should be set to true");
        assertNotNull(verification.getVerifiedAt(), "verifiedAt timestamp should be set");
        assertTrue(response.getNotice().contains("Design Rule #4"),
                "Response notice must clarify Design Rule #4 (inbox control only)");

        verify(companyRepository, times(1)).save(company);
        verify(emailVerificationRepository, times(1)).save(verification);
    }

    @Test
    @DisplayName("verifyEmail successfully verifies valid student token and marks verifiedAt")
    void verifyEmailStudentSuccess() {
        String token = "valid-student-token-12345";
        EmailVerification verification = new EmailVerification();
        verification.setToken(token);
        verification.setUser(studentUser);
        verification.setExpiry(Instant.now().plus(12, ChronoUnit.HOURS));
        verification.setVerifiedAt(null);

        when(emailVerificationRepository.findByToken(token)).thenReturn(Optional.of(verification));
        when(emailVerificationRepository.save(any(EmailVerification.class))).thenAnswer(inv -> inv.getArgument(0));

        VerifyEmailResponse response = emailVerificationService.verifyEmail(token);

        assertTrue(response.isVerified());
        assertEquals("bob@student.edu", response.getEmail());
        assertEquals("Bob Student", response.getCompanyName());
        assertNotNull(verification.getVerifiedAt());
        verify(emailVerificationRepository, times(1)).save(verification);
        verify(companyRepository, never()).save(any());
    }

    @Test
    @DisplayName("verifyEmail rejects password reset token")
    void verifyEmailRejectsResetToken() {
        String token = "reset_token_12345";

        ApiException ex = assertThrows(ApiException.class, () ->
                emailVerificationService.verifyEmail(token));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Invalid or unrecognized verification token"));
    }

    @Test
    @DisplayName("verifyEmail returns success message without re-saving if token is already verified")
    void verifyEmailAlreadyVerified() {
        String token = "already-verified-token";
        EmailVerification verification = new EmailVerification();
        verification.setToken(token);
        verification.setCompany(company);
        verification.setExpiry(Instant.now().plus(12, ChronoUnit.HOURS));
        verification.setVerifiedAt(Instant.now().minus(1, ChronoUnit.HOURS));

        when(emailVerificationRepository.findByToken(token)).thenReturn(Optional.of(verification));

        VerifyEmailResponse response = emailVerificationService.verifyEmail(token);

        assertTrue(response.isVerified());
        assertTrue(response.getMessage().contains("already been verified"));
        verify(companyRepository, never()).save(any());
    }

    @Test
    @DisplayName("verifyEmail throws BAD_REQUEST when token is expired")
    void verifyEmailExpired() {
        String token = "expired-token";
        EmailVerification verification = new EmailVerification();
        verification.setToken(token);
        verification.setCompany(company);
        verification.setExpiry(Instant.now().minus(2, ChronoUnit.HOURS));
        verification.setVerifiedAt(null);

        when(emailVerificationRepository.findByToken(token)).thenReturn(Optional.of(verification));

        ApiException exception = assertThrows(ApiException.class, () ->
                emailVerificationService.verifyEmail(token));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertTrue(exception.getMessage().contains("expired"));
        verify(companyRepository, never()).save(any());
    }

    @Test
    @DisplayName("resendVerification generates new code for unverified company")
    void resendVerificationCompanyUnverified() {
        when(userRepository.findByEmail("careers@acme-global.org")).thenReturn(Optional.empty());
        when(companyRepository.findByEmail("careers@acme-global.org")).thenReturn(Optional.of(company));
        when(emailVerificationRepository.save(any(EmailVerification.class))).thenAnswer(inv -> inv.getArgument(0));

        ResendVerificationResponse response = emailVerificationService.resendVerification("careers@acme-global.org");

        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("fresh verification code has been sent"));
        verify(emailService, times(1)).sendVerificationCode(eq(company.getEmail()), eq(company.getCompanyName()), anyString());
    }

    @Test
    @DisplayName("resendVerification generates new code for unverified student")
    void resendVerificationStudentUnverified() {
        when(userRepository.findByEmail("bob@student.edu")).thenReturn(Optional.of(studentUser));
        when(emailVerificationRepository.isUserEmailVerified(studentUser)).thenReturn(false);
        when(emailVerificationRepository.save(any(EmailVerification.class))).thenAnswer(inv -> inv.getArgument(0));

        ResendVerificationResponse response = emailVerificationService.resendVerification("bob@student.edu");

        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("fresh verification code has been sent"));
        verify(emailService, times(1)).sendVerificationCode(eq(studentUser.getEmail()), eq(studentUser.getName()), anyString());
    }

    @Test
    @DisplayName("resendVerification informs user if student is already verified")
    void resendVerificationStudentAlreadyVerified() {
        when(userRepository.findByEmail("bob@student.edu")).thenReturn(Optional.of(studentUser));
        when(emailVerificationRepository.isUserEmailVerified(studentUser)).thenReturn(true);

        ResendVerificationResponse response = emailVerificationService.resendVerification("bob@student.edu");

        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("already verified"));
        verify(emailService, never()).sendVerificationCode(any(), any(), any());
    }

    @Test
    @DisplayName("verifyCode successfully verifies valid student 6-digit code")
    void verifyCode_student_success() {
        EmailVerification verification = new EmailVerification();
        verification.setToken("123456");
        verification.setUser(studentUser);
        verification.setExpiry(Instant.now().plus(8, ChronoUnit.MINUTES));

        when(userRepository.findByEmail("bob@student.edu")).thenReturn(Optional.of(studentUser));
        when(emailVerificationRepository.isUserEmailVerified(studentUser)).thenReturn(false);
        when(emailVerificationRepository.findTopByUserAndTokenAndVerifiedAtIsNull(studentUser, "123456"))
                .thenReturn(Optional.of(verification));
        when(emailVerificationRepository.save(any(EmailVerification.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = emailVerificationService.verifyCode(
                new com.internship.platform.dto.VerifyCodeRequest("bob@student.edu", "123456"));

        assertNotNull(result);
        assertEquals("bob@student.edu", result.getEmail());
        assertNotNull(verification.getVerifiedAt());
        verify(emailVerificationRepository).save(verification);
    }

    @Test
    @DisplayName("verifyCode successfully verifies valid company 6-digit code and marks company verified")
    void verifyCode_company_success() {
        User compUser = new User();
        compUser.setEmail("careers@acme.com");
        compUser.setRole(UserRole.COMPANY);

        Company comp = new Company();
        comp.setId(20L);
        comp.setEmail("careers@acme.com");
        comp.setEmailVerified(false);

        EmailVerification verification = new EmailVerification();
        verification.setToken("654321");
        verification.setCompany(comp);
        verification.setExpiry(Instant.now().plus(8, ChronoUnit.MINUTES));

        when(userRepository.findByEmail("careers@acme.com")).thenReturn(Optional.of(compUser));
        when(companyRepository.findByUser(compUser)).thenReturn(Optional.of(comp));
        when(emailVerificationRepository.findTopByCompanyAndTokenAndVerifiedAtIsNull(comp, "654321"))
                .thenReturn(Optional.of(verification));
        when(emailVerificationRepository.save(any(EmailVerification.class))).thenAnswer(inv -> inv.getArgument(0));
        when(companyRepository.save(any(Company.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = emailVerificationService.verifyCode(
                new com.internship.platform.dto.VerifyCodeRequest("careers@acme.com", "654321"));

        assertNotNull(result);
        assertTrue(comp.isEmailVerified());
        assertNotNull(verification.getVerifiedAt());
        verify(companyRepository).save(comp);
    }

    @Test
    @DisplayName("verifyCode throws BAD_REQUEST when code is expired")
    void verifyCode_expired_throwsBadRequest() {
        EmailVerification verification = new EmailVerification();
        verification.setToken("123456");
        verification.setUser(studentUser);
        verification.setExpiry(Instant.now().minus(1, ChronoUnit.MINUTES));

        when(userRepository.findByEmail("bob@student.edu")).thenReturn(Optional.of(studentUser));
        when(emailVerificationRepository.isUserEmailVerified(studentUser)).thenReturn(false);
        when(emailVerificationRepository.findTopByUserAndTokenAndVerifiedAtIsNull(studentUser, "123456"))
                .thenReturn(Optional.of(verification));

        ApiException ex = assertThrows(ApiException.class, () ->
                emailVerificationService.verifyCode(
                        new com.internship.platform.dto.VerifyCodeRequest("bob@student.edu", "123456")));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("expired"));
    }

    @Test
    @DisplayName("forgotPassword sends reset 6-digit code for existing user and returns generic message")
    void forgotPassword_existingUser() {
        when(userRepository.findByEmail("bob@student.edu")).thenReturn(Optional.of(studentUser));
        when(emailVerificationRepository.save(any(EmailVerification.class))).thenAnswer(inv -> inv.getArgument(0));

        ForgotPasswordResponse resp = emailVerificationService.forgotPassword(new ForgotPasswordRequest("bob@student.edu"));

        assertTrue(resp.isSuccess());
        assertTrue(resp.getMessage().contains("we have sent a 6-digit password reset code"));
        verify(emailService, times(1)).sendPasswordResetCode(eq(studentUser.getEmail()), eq(studentUser.getName()), anyString());
    }

    @Test
    @DisplayName("forgotPassword returns generic message without error for non-existent user")
    void forgotPassword_nonExistentUser() {
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        ForgotPasswordResponse resp = emailVerificationService.forgotPassword(new ForgotPasswordRequest("nobody@example.com"));

        assertTrue(resp.isSuccess());
        assertTrue(resp.getMessage().contains("we have sent a 6-digit password reset code"));
        verify(emailService, never()).sendPasswordResetCode(any(), any(), any());
    }

    @Test
    @DisplayName("resetPassword successfully resets password with 6-digit code and BCrypt hash")
    void resetPassword_success() {
        String code = "481920";
        String token = "reset_" + code;
        EmailVerification verification = new EmailVerification();
        verification.setToken(token);
        verification.setUser(studentUser);
        verification.setExpiry(Instant.now().plus(8, ChronoUnit.MINUTES));
        verification.setVerifiedAt(null);

        when(userRepository.findByEmail("bob@student.edu")).thenReturn(Optional.of(studentUser));
        when(emailVerificationRepository.findTopByUserAndTokenAndVerifiedAtIsNull(studentUser, token))
                .thenReturn(Optional.of(verification));
        when(passwordEncoder.encode("NewSecret123!")).thenReturn("new_bcrypt_hash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(emailVerificationRepository.save(any(EmailVerification.class))).thenAnswer(inv -> inv.getArgument(0));

        ResetPasswordResponse resp = emailVerificationService.resetPassword(
                new ResetPasswordRequest("bob@student.edu", code, "NewSecret123!"));

        assertTrue(resp.isSuccess());
        assertEquals("new_bcrypt_hash", studentUser.getPasswordHash());
        assertNotNull(verification.getVerifiedAt());
        verify(userRepository, times(1)).save(studentUser);
        verify(emailVerificationRepository, times(1)).save(verification);
    }

    @Test
    @DisplayName("resetPassword throws BAD_REQUEST if code is expired")
    void resetPassword_expiredToken() {
        String code = "481920";
        String token = "reset_" + code;
        EmailVerification verification = new EmailVerification();
        verification.setToken(token);
        verification.setUser(studentUser);
        verification.setExpiry(Instant.now().minus(5, ChronoUnit.MINUTES));
        verification.setVerifiedAt(null);

        when(emailVerificationRepository.findByToken(token)).thenReturn(Optional.of(verification));

        ApiException ex = assertThrows(ApiException.class, () ->
                emailVerificationService.resetPassword(new ResetPasswordRequest(token, "NewSecret123!")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("expired"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("resetPassword throws BAD_REQUEST if code is already used")
    void resetPassword_alreadyUsedToken() {
        String code = "481920";
        String token = "reset_" + code;
        EmailVerification verification = new EmailVerification();
        verification.setToken(token);
        verification.setUser(studentUser);
        verification.setExpiry(Instant.now().plus(8, ChronoUnit.MINUTES));
        verification.setVerifiedAt(Instant.now().minus(2, ChronoUnit.MINUTES));

        when(emailVerificationRepository.findByToken(token)).thenReturn(Optional.of(verification));

        ApiException ex = assertThrows(ApiException.class, () ->
                emailVerificationService.resetPassword(new ResetPasswordRequest(token, "NewSecret123!")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("already been used"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("resetPassword throws BAD_REQUEST if code is invalid or not found")
    void resetPassword_invalidCode() {
        String token = "reset_999999";
        when(emailVerificationRepository.findByToken(token)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () ->
                emailVerificationService.resetPassword(new ResetPasswordRequest("999999", "NewSecret123!")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Invalid or unrecognized password reset code"));
    }

    @Test
    @DisplayName("verifyCode: Wrong code increments attempts and reports remaining attempts")
    void verifyCode_wrongCode_incrementsAttempts() {
        EmailVerification verification = new EmailVerification();
        verification.setToken("111111");
        verification.setUser(studentUser);
        verification.setExpiry(Instant.now().plus(8, ChronoUnit.MINUTES));
        verification.setAttempts(0);

        when(userRepository.findByEmail("bob@student.edu")).thenReturn(Optional.of(studentUser));
        when(emailVerificationRepository.isUserEmailVerified(studentUser)).thenReturn(false);
        when(emailVerificationRepository.findTopByUserAndTokenAndVerifiedAtIsNull(studentUser, "999999"))
                .thenReturn(Optional.empty());
        when(emailVerificationRepository.findTopByUserAndVerifiedAtIsNullOrderByExpiryDesc(studentUser))
                .thenReturn(Optional.of(verification));
        when(emailVerificationRepository.save(any(EmailVerification.class))).thenAnswer(inv -> inv.getArgument(0));

        ApiException ex = assertThrows(ApiException.class, () ->
                emailVerificationService.verifyCode(
                        new com.internship.platform.dto.VerifyCodeRequest("bob@student.edu", "999999")));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals(1, verification.getAttempts());
        assertTrue(ex.getMessage().contains("4 attempts remaining"));
        verify(emailVerificationRepository).save(verification);
        verify(emailVerificationRepository, never()).delete(any());
    }

    @Test
    @DisplayName("verifyCode: 5 failed attempts invalidates code and deletes it")
    void verifyCode_maxAttempts_invalidatesCode() {
        EmailVerification verification = new EmailVerification();
        verification.setToken("111111");
        verification.setUser(studentUser);
        verification.setExpiry(Instant.now().plus(8, ChronoUnit.MINUTES));
        verification.setAttempts(4); // 4th attempt already made, next is 5th

        when(userRepository.findByEmail("bob@student.edu")).thenReturn(Optional.of(studentUser));
        when(emailVerificationRepository.isUserEmailVerified(studentUser)).thenReturn(false);
        when(emailVerificationRepository.findTopByUserAndTokenAndVerifiedAtIsNull(studentUser, "999999"))
                .thenReturn(Optional.empty());
        when(emailVerificationRepository.findTopByUserAndVerifiedAtIsNullOrderByExpiryDesc(studentUser))
                .thenReturn(Optional.of(verification));

        ApiException ex = assertThrows(ApiException.class, () ->
                emailVerificationService.verifyCode(
                        new com.internship.platform.dto.VerifyCodeRequest("bob@student.edu", "999999")));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Too many failed attempts"));
        verify(emailVerificationRepository).delete(verification);
    }
}
