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

    /**
     * Send email verification link to student inbox, or log to console in local development.
     *
     * @param toEmail      Recipient email address
     * @param studentName  Student display name
     * @param token        Secure verification token
     * @return Full verification link that was sent or logged
     */
    public String sendStudentVerificationEmail(String toEmail, String studentName, String token) {
        String verificationLink = frontendUrl + "/verify-email?token=" + token;

        boolean smtpConfigured = mailSender != null && mailHost != null && !mailHost.isBlank();

        if (smtpConfigured) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromAddress);
                message.setTo(toEmail);
                message.setSubject("Verify your student email address on Interniqo");
                message.setText(
                        "Hello " + (studentName != null ? studentName : "Student") + ",\n\n" +
                        "Thank you for registering on Interniqo.\n\n" +
                        "Please click the link below to verify control of your email address:\n" +
                        verificationLink + "\n\n" +
                        "This link will expire in 24 hours.\n\n" +
                        "--------------------------------------------------------------------------------\n" +
                        "Notice (Design Rule #4): This verification confirms access and control of this\n" +
                        "email inbox only. It does not certify academic enrollment or student identity.\n" +
                        "--------------------------------------------------------------------------------\n\n" +
                        "Best regards,\n" +
                        "The Interniqo Team"
                );
                mailSender.send(message);
                log.info("Sent student verification email via SMTP to {}", toEmail);
                return verificationLink;
            } catch (Exception ex) {
                log.warn("Failed to send student verification email via SMTP to {}: {}. Falling back to console logging.",
                        toEmail, ex.getMessage());
            }
        }

        // Local development fallback: Log clearly to console
        logStudentVerificationLinkToConsole(toEmail, studentName, verificationLink);
        return verificationLink;
    }

    /**
     * Send password reset link to user inbox, or log to console in local development.
     *
     * @param toEmail Recipient email address
     * @param name    User display name
     * @param token   Secure reset token
     * @return Full password reset link that was sent or logged
     */
    public String sendPasswordResetEmail(String toEmail, String name, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        boolean smtpConfigured = mailSender != null && mailHost != null && !mailHost.isBlank();

        if (smtpConfigured) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromAddress);
                message.setTo(toEmail);
                message.setSubject("Reset your password on Interniqo");
                message.setText(
                        "Hello " + (name != null ? name : "User") + ",\n\n" +
                        "We received a request to reset your password on Interniqo.\n\n" +
                        "Please click the link below to set a new password:\n" +
                        resetLink + "\n\n" +
                        "This link will expire in 1 hour. If you did not request this, please ignore this email.\n\n" +
                        "Best regards,\n" +
                        "The Interniqo Team"
                );
                mailSender.send(message);
                log.info("Sent password reset email via SMTP to {}", toEmail);
                return resetLink;
            } catch (Exception ex) {
                log.warn("Failed to send password reset email via SMTP to {}: {}. Falling back to console logging.",
                        toEmail, ex.getMessage());
            }
        }

        // Local development fallback: Log clearly to console
        logPasswordResetLinkToConsole(toEmail, name, resetLink);
        return resetLink;
    }

    /**
     * Send 6-digit verification code to user/company inbox, or log to console in local development.
     *
     * @param toEmail Recipient email address
     * @param name    User or Company display name
     * @param code    6-digit numeric verification code
     */
    public void sendVerificationCode(String toEmail, String name, String code) {
        boolean smtpConfigured = mailSender != null && mailHost != null && !mailHost.isBlank();

        if (smtpConfigured) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromAddress);
                message.setTo(toEmail);
                message.setSubject("Your Interniqo verification code: " + code);
                message.setText(
                        "Hello " + (name != null ? name : "User") + ",\n\n" +
                        "Thank you for registering on Interniqo.\n\n" +
                        "Your 6-digit verification code is:\n\n" +
                        "    " + code + "\n\n" +
                        "This code will expire in 10 minutes. Please enter it on the verification screen to activate your account.\n\n" +
                        "--------------------------------------------------------------------------------\n" +
                        "Notice (Design Rule #4): Email verification confirms control of this email address\n" +
                        "only. It does not certify legal business incorporation or academic standing.\n" +
                        "--------------------------------------------------------------------------------\n\n" +
                        "Best regards,\n" +
                        "The Interniqo Team"
                );
                mailSender.send(message);
                log.info("Sent verification code via SMTP to {}", toEmail);
                return;
            } catch (Exception ex) {
                log.warn("Failed to send verification code via SMTP to {}: {}. Falling back to console logging.",
                        toEmail, ex.getMessage());
            }
        }

        // Local development fallback: Log clearly to console
        logVerificationCodeToConsole(toEmail, name, code);
    }

    /**
     * Send 6-digit password reset code to user inbox, or log to console in local development.
     *
     * @param toEmail Recipient email address
     * @param name    User display name
     * @param code    6-digit numeric reset code
     */
    public void sendPasswordResetCode(String toEmail, String name, String code) {
        boolean smtpConfigured = mailSender != null && mailHost != null && !mailHost.isBlank();

        if (smtpConfigured) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromAddress);
                message.setTo(toEmail);
                message.setSubject("Your Interniqo password reset code: " + code);
                message.setText(
                        "Hello " + (name != null ? name : "User") + ",\n\n" +
                        "We received a request to reset your password on Interniqo.\n\n" +
                        "Your 6-digit password reset code is:\n\n" +
                        "    " + code + "\n\n" +
                        "This code will expire in 10 minutes. If you did not request this, please ignore this email.\n\n" +
                        "Best regards,\n" +
                        "The Interniqo Team"
                );
                mailSender.send(message);
                log.info("Sent password reset code via SMTP to {}", toEmail);
                return;
            } catch (Exception ex) {
                log.warn("Failed to send password reset code via SMTP to {}: {}. Falling back to console logging.",
                        toEmail, ex.getMessage());
            }
        }

        // Local development fallback: Log clearly to console
        logPasswordResetCodeToConsole(toEmail, name, code);
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

    private void logStudentVerificationLinkToConsole(String toEmail, String studentName, String verificationLink) {
        String border = "=".repeat(80);
        String msg = "\n" + border + "\n" +
                "[LOCAL DEV EMAIL] Student Verification Link Generated (SMTP not configured or local mode)\n" +
                "To: " + toEmail + " (" + (studentName != null ? studentName : "Student") + ")\n" +
                "Link: " + verificationLink + "\n" +
                "Expiry: 24 hours\n" +
                "Design Rule #4: Verifies inbox control only, not legal academic identity.\n" +
                border;
        log.info("{}", msg);
        System.out.println(msg);
    }

    private void logPasswordResetLinkToConsole(String toEmail, String name, String resetLink) {
        String border = "=".repeat(80);
        String msg = "\n" + border + "\n" +
                "[LOCAL DEV EMAIL] Password Reset Link Generated (SMTP not configured or local mode)\n" +
                "To: " + toEmail + " (" + (name != null ? name : "User") + ")\n" +
                "Link: " + resetLink + "\n" +
                "Expiry: 1 hour\n" +
                border;
        log.info("{}", msg);
        System.out.println(msg);
    }

    private void logVerificationCodeToConsole(String toEmail, String name, String code) {
        String border = "=".repeat(80);
        String msg = "\n" + border + "\n" +
                "[LOCAL DEV EMAIL] 6-Digit Verification Code (SMTP fallback)\n" +
                "To: " + toEmail + " (" + (name != null ? name : "User") + ")\n" +
                "Code: " + code + "\n" +
                "Expiry: 10 minutes\n" +
                "Design Rule #4: Verifies inbox control only, not legal company identity.\n" +
                border;
        log.info("{}", msg);
        System.out.println(msg);
    }

    private void logPasswordResetCodeToConsole(String toEmail, String name, String code) {
        String border = "=".repeat(80);
        String msg = "\n" + border + "\n" +
                "[LOCAL DEV EMAIL] 6-Digit Password Reset Code (SMTP fallback)\n" +
                "To: " + toEmail + " (" + (name != null ? name : "User") + ")\n" +
                "Code: " + code + "\n" +
                "Expiry: 10 minutes\n" +
                border;
        log.info("{}", msg);
        System.out.println(msg);
    }
}

