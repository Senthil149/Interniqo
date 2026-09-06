package com.internship.platform.service;

import com.internship.platform.dto.ResendVerificationResponse;
import com.internship.platform.dto.VerifyEmailResponse;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.EmailVerification;
import com.internship.platform.entity.User;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.EmailVerificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

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
    private EmailService emailService;

    @InjectMocks
    private EmailVerificationService emailVerificationService;

    private Company company;

    @BeforeEach
    void setUp() {
        company = new Company();
        company.setId(10L);
        company.setCompanyName("Acme Global");
        company.setEmail("careers@acme-global.org");
        company.setEmailVerified(false);
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
    @DisplayName("createAndSendVerification creates a 24-hour token, saves record, and calls EmailService")
    void createAndSendVerificationSuccess() {
        when(emailVerificationRepository.save(any(EmailVerification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        EmailVerification verification = emailVerificationService.createAndSendVerification(company);

        assertNotNull(verification);
        assertNotNull(verification.getToken());
        assertTrue(verification.getToken().length() >= 32);
        assertEquals(company, verification.getCompany());
        assertNull(verification.getUser());
        assertNull(verification.getVerifiedAt());

        // Expiry should be approximately 24 hours in the future
        Instant minExpected = Instant.now().plus(23, ChronoUnit.HOURS);
        Instant maxExpected = Instant.now().plus(25, ChronoUnit.HOURS);
        assertTrue(verification.getExpiry().isAfter(minExpected));
        assertTrue(verification.getExpiry().isBefore(maxExpected));

        verify(emailService, times(1)).sendVerificationEmail(
                eq(company.getEmail()), eq(company.getCompanyName()), eq(verification.getToken()));
    }

    @Test
    @DisplayName("verifyEmail successfully verifies valid token, marks company email_verified=true, and complies with Design Rule #4")
    void verifyEmailSuccess() {
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
    @DisplayName("resendVerification generates new token for unverified company")
    void resendVerificationUnverified() {
        when(companyRepository.findByEmail("careers@acme-global.org")).thenReturn(Optional.of(company));
        when(emailVerificationRepository.save(any(EmailVerification.class))).thenAnswer(inv -> inv.getArgument(0));

        ResendVerificationResponse response = emailVerificationService.resendVerification("careers@acme-global.org");

        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("fresh verification link has been sent"));
        verify(emailService, times(1)).sendVerificationEmail(eq(company.getEmail()), eq(company.getCompanyName()), anyString());
    }

    @Test
    @DisplayName("resendVerification informs user if company is already verified")
    void resendVerificationAlreadyVerified() {
        company.setEmailVerified(true);
        when(companyRepository.findByEmail("careers@acme-global.org")).thenReturn(Optional.of(company));

        ResendVerificationResponse response = emailVerificationService.resendVerification("careers@acme-global.org");

        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("already verified"));
        verify(emailService, never()).sendVerificationEmail(any(), any(), any());
    }
}
