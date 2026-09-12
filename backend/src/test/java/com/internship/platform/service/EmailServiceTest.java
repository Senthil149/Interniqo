package com.internship.platform.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService();
        ReflectionTestUtils.setField(emailService, "fromAddress", "noreply@interniqo.com");
        ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:5173");
    }

    @Test
    @DisplayName("sendVerificationEmail: When SMTP is configured, sends SimpleMailMessage containing Design Rule #4 disclaimer")
    void sendVerificationEmail_smtpConfigured_sendsEmailWithDesignRule4Notice() {
        ReflectionTestUtils.setField(emailService, "mailSender", mailSender);
        ReflectionTestUtils.setField(emailService, "mailHost", "smtp.sendgrid.net");

        String link = emailService.sendVerificationEmail("careers@acme.com", "Acme Corp", "secure_token_123");

        assertEquals("http://localhost:5173/verify-email?token=secure_token_123", link);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        SimpleMailMessage sentMessage = captor.getValue();
        assertEquals("careers@acme.com", sentMessage.getTo()[0]);
        assertEquals("noreply@interniqo.com", sentMessage.getFrom());
        assertTrue(sentMessage.getSubject().contains("Verify your company email"));

        String text = sentMessage.getText();
        assertNotNull(text);
        assertTrue(text.contains("http://localhost:5173/verify-email?token=secure_token_123"));
        assertTrue(text.contains("Design Rule #4"), "Email content must include Design Rule #4 disclaimer");
        assertTrue(text.contains("inbox only"), "Email content must clarify inbox control per Design Rule #4");
        assertTrue(text.contains("legal company identity"), "Email content must clarify not legal identity per Design Rule #4");
    }

    @Test
    @DisplayName("sendVerificationEmail: When SMTP host is empty (local dev), logs to console without throwing or calling mailSender")
    void sendVerificationEmail_smtpEmpty_fallsBackToConsole() {
        ReflectionTestUtils.setField(emailService, "mailHost", "");
        ReflectionTestUtils.setField(emailService, "mailSender", mailSender);

        String link = emailService.sendVerificationEmail("careers@acme.com", "Acme Corp", "dev_token_456");

        assertEquals("http://localhost:5173/verify-email?token=dev_token_456", link);
        verifyNoInteractions(mailSender);
    }
}
