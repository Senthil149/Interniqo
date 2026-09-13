package com.internship.platform.service;

import com.internship.platform.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Service for delivering emails via Gmail SMTP using JavaMailSender.
 *
 * Security requirements:
 * - OTP is never printed to terminal/logs.
 * - Recipient is dynamic (user-entered email).
 * - Sender is configured via MAIL_FROM / SMTP_USERNAME.
 * - Credentials injected via environment variables.
 *
 * Design Rule #4 compliance:
 * Verification emails clearly state that confirming this code verifies inbox control only,
 * not legal company identity or business credentials.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.mail.from:}")
    private String fromAddress;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Check if SMTP has been properly configured with a host and username.
     */
    public boolean isSmtpConfigured() {
        return mailSender != null
                && mailHost != null && !mailHost.isBlank()
                && mailUsername != null && !mailUsername.isBlank();
    }

    /**
     * Send 6-digit OTP verification code to a user or company inbox.
     * Dynamic recipient: The user's input email is always the recipient.
     * Sender: Interniqo configured business address (MAIL_FROM).
     *
     * @param recipientEmail User-provided recipient email
     * @param otp            6-digit numeric verification code
     */
    public void sendOtpEmail(String recipientEmail, String otp) {
        sendOtpEmail(recipientEmail, otp, "verification");
    }

    /**
     * Send 6-digit OTP verification code with specific purpose (verification or password reset).
     *
     * @param recipientEmail User-provided recipient email
     * @param otp            6-digit numeric verification code
     * @param purpose        "verification" or "password-reset"
     */
    public void sendOtpEmail(String recipientEmail, String otp, String purpose) {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            throw new IllegalArgumentException("Recipient email address cannot be empty");
        }
        if (otp == null || otp.isBlank()) {
            throw new IllegalArgumentException("OTP code cannot be empty");
        }

        String toEmail = recipientEmail.trim();
        String subject = "password-reset".equalsIgnoreCase(purpose)
                ? "Interniqo - Password Reset Code"
                : "Interniqo - Email Verification Code";

        String introAction = "password-reset".equalsIgnoreCase(purpose)
                ? "reset your account password on"
                : "verify your email address on";

        String text = "Hello,\n\n"
                + "We received a request to " + introAction + " Interniqo.\n\n"
                + "Your 6-digit verification code is:\n\n"
                + "    " + otp + "\n\n"
                + "This verification code will expire in 10 minutes.\n\n"
                + "Security Notice:\n"
                + "If you did not request this verification code, please ignore this email or contact support.\n"
                + "For your security, never share this code with anyone. Interniqo staff will never ask for your code.\n\n"
                + "--------------------------------------------------------------------------------\n"
                + "Notice (Design Rule #4): Email verification confirms control of this email address\n"
                + "only. It does not certify legal business incorporation or academic standing.\n"
                + "--------------------------------------------------------------------------------\n\n"
                + "Best regards,\n"
                + "The Interniqo Team\n";

        String effectiveFrom = (fromAddress != null && !fromAddress.isBlank())
                ? fromAddress
                : ((mailUsername != null && !mailUsername.isBlank()) ? mailUsername : "noreply@interniqo.com");

        if (isSmtpConfigured()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(effectiveFrom);
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(text);
                mailSender.send(message);
                log.info("Sent OTP verification email via SMTP to {}", maskEmail(toEmail));
            } catch (Exception ex) {
                log.error("Failed to send OTP verification email via SMTP to {}: {}", maskEmail(toEmail), ex.getMessage());
                throw new ApiException(HttpStatus.BAD_GATEWAY,
                        "Failed to deliver verification email via SMTP: " + ex.getMessage());
            }
        } else {
            log.warn("SMTP credentials not configured (SMTP_USERNAME is empty). Email delivery skipped for {}.", maskEmail(toEmail));
        }
    }

    /**
     * Backward-compatible delegation for 6-digit verification code.
     */
    public void sendVerificationCode(String toEmail, String name, String code) {
        sendOtpEmail(toEmail, code, "verification");
    }

    /**
     * Backward-compatible delegation for 6-digit password reset code.
     */
    public void sendPasswordResetCode(String toEmail, String name, String code) {
        sendOtpEmail(toEmail, code, "password-reset");
    }

    /**
     * Send email verification link to company inbox.
     */
    public String sendVerificationEmail(String toEmail, String companyName, String token) {
        String verificationLink = frontendUrl + "/verify-email?token=" + token;
        String effectiveFrom = (fromAddress != null && !fromAddress.isBlank())
                ? fromAddress
                : ((mailUsername != null && !mailUsername.isBlank()) ? mailUsername : "noreply@interniqo.com");

        if (isSmtpConfigured()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(effectiveFrom);
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
                log.info("Sent verification email via SMTP to {}", maskEmail(toEmail));
                return verificationLink;
            } catch (Exception ex) {
                log.warn("Failed to send verification email via SMTP to {}: {}", maskEmail(toEmail), ex.getMessage());
            }
        } else {
            log.warn("SMTP credentials not configured. Verification link email skipped for {}.", maskEmail(toEmail));
        }
        return verificationLink;
    }

    /**
     * Send email verification link to student inbox.
     */
    public String sendStudentVerificationEmail(String toEmail, String studentName, String token) {
        String verificationLink = frontendUrl + "/verify-email?token=" + token;
        String effectiveFrom = (fromAddress != null && !fromAddress.isBlank())
                ? fromAddress
                : ((mailUsername != null && !mailUsername.isBlank()) ? mailUsername : "noreply@interniqo.com");

        if (isSmtpConfigured()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(effectiveFrom);
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
                log.info("Sent student verification email via SMTP to {}", maskEmail(toEmail));
                return verificationLink;
            } catch (Exception ex) {
                log.warn("Failed to send student verification email via SMTP to {}: {}", maskEmail(toEmail), ex.getMessage());
            }
        } else {
            log.warn("SMTP credentials not configured. Student verification email skipped for {}.", maskEmail(toEmail));
        }
        return verificationLink;
    }

    /**
     * Send password reset link to user inbox.
     */
    public String sendPasswordResetEmail(String toEmail, String name, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String effectiveFrom = (fromAddress != null && !fromAddress.isBlank())
                ? fromAddress
                : ((mailUsername != null && !mailUsername.isBlank()) ? mailUsername : "noreply@interniqo.com");

        if (isSmtpConfigured()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(effectiveFrom);
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
                log.info("Sent password reset email via SMTP to {}", maskEmail(toEmail));
                return resetLink;
            } catch (Exception ex) {
                log.warn("Failed to send password reset email via SMTP to {}: {}", maskEmail(toEmail), ex.getMessage());
            }
        } else {
            log.warn("SMTP credentials not configured. Password reset email skipped for {}.", maskEmail(toEmail));
        }
        return resetLink;
    }

    /**
     * Mask email address for secure logging (e.g. s***l@gmail.com).
     */
    private String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "unknown";
        }
        int atIndex = email.indexOf('@');
        if (atIndex <= 1) {
            return "***" + (atIndex >= 0 ? email.substring(atIndex) : "");
        }
        return email.charAt(0) + "***" + email.substring(atIndex);
    }
}
