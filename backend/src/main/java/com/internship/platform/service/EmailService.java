package com.internship.platform.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Service for delivering emails via SMTP, with automatic console logging fallback for local development.
 *
 * Design Rule #4 compliance:
 * Verification emails clearly state that confirming this link verifies inbox control only,
 * not legal company identity or business credentials.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${app.mail.from:noreply@interniqo.com}")
    private String fromAddress;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Send email verification link to company inbox, or log to console in local development.
     *
     * @param toEmail      Recipient email address
     * @param companyName  Company display name
     * @param token        Secure verification token
     * @return Full verification link that was sent or logged
     */
    public String sendVerificationEmail(String toEmail, String companyName, String token) {
        String verificationLink = frontendUrl + "/verify-email?token=" + token;

        boolean smtpConfigured = mailSender != null && mailHost != null && !mailHost.isBlank();

        if (smtpConfigured) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromAddress);
                message.setTo(toEmail);
                message.setSubject("Verify your company email address on Interniqo");
                message.setText(
                        "Hello " + (companyName != null ? companyName : "Partner") + ",\n\n" +
                        "Thank you for registering on Interniqo.\n\n" +
                        "Please click the link below to verify control of your email address:\n" +
                        verificationLink + "\n\n" +
                        "This link will expire in 24 hours.\n\n" +
                        "--------------------------------------------------------------------------------\n" +
                        "Notice (Design Rule #4): This verification confirms access and control of this\n" +
                        "inbox only. It does not certify legal company identity or business incorporation.\n" +
                        "--------------------------------------------------------------------------------\n\n" +
                        "Best regards,\n" +
                        "The Interniqo Team"
                );
                mailSender.send(message);
                log.info("Sent verification email via SMTP to {}", toEmail);
                return verificationLink;
            } catch (Exception ex) {
                log.warn("Failed to send verification email via SMTP to {}: {}. Falling back to console logging.",
                        toEmail, ex.getMessage());
            }
        }

        // Local development fallback: Log clearly to console
        logVerificationLinkToConsole(toEmail, companyName, verificationLink);
        return verificationLink;
    }

    private void logVerificationLinkToConsole(String toEmail, String companyName, String verificationLink) {
        String border = "=".repeat(80);
        String msg = "\n" + border + "\n" +
                "[LOCAL DEV EMAIL] Verification Link Generated (SMTP not configured or local mode)\n" +
                "To: " + toEmail + " (" + (companyName != null ? companyName : "Company") + ")\n" +
                "Link: " + verificationLink + "\n" +
                "Expiry: 24 hours\n" +
                "Design Rule #4: Verifies inbox control only, not legal company identity.\n" +
                border;
        log.info("{}", msg);
        System.out.println(msg);
    }
}
