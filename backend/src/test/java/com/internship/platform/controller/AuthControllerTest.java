package com.internship.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internship.platform.dto.AuthResponse;
import com.internship.platform.dto.ForgotPasswordRequest;
import com.internship.platform.dto.ForgotPasswordResponse;
import com.internship.platform.dto.LoginRequest;
import com.internship.platform.dto.RefreshRequest;
import com.internship.platform.dto.RegisterRequest;
import com.internship.platform.dto.RegisterResponse;
import com.internship.platform.dto.ResendVerificationRequest;
import com.internship.platform.dto.ResendVerificationResponse;
import com.internship.platform.dto.ResetPasswordRequest;
import com.internship.platform.dto.ResetPasswordResponse;
import com.internship.platform.dto.UserSummary;
import com.internship.platform.dto.VerifyEmailResponse;
import com.internship.platform.entity.UserRole;
import com.internship.platform.service.AuthService;
import com.internship.platform.service.EmailVerificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private EmailVerificationService emailVerificationService;

    @Test
    @DisplayName("POST /api/auth/register returns 201 Created and RegisterResponse with requiresVerification=true")
    void registerReturnsCreatedTokens() throws Exception {
        RegisterResponse regResponse = new RegisterResponse(
                "ada@example.com",
                "Ada",
                UserRole.STUDENT,
                true,
                "Please enter verification code"
        );
        when(authService.register(any(RegisterRequest.class)))
                .thenReturn(regResponse);

        RegisterRequest request = new RegisterRequest();
        request.setName("Ada");
        request.setEmail("ada@example.com");
        request.setPassword("password1");
        request.setRole(UserRole.STUDENT);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.requiresVerification").value(true))
                .andExpect(jsonPath("$.email").value("ada@example.com"))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    @DisplayName("POST /api/auth/verify-code returns 200 OK and JWT tokens")
    void verifyCodeReturnsTokens() throws Exception {
        UserSummary summary = new UserSummary();
        summary.setId(1L);
        summary.setName("Ada");
        summary.setEmail("ada@example.com");
        summary.setRole(UserRole.STUDENT);

        when(authService.verifyCode(any(com.internship.platform.dto.VerifyCodeRequest.class)))
                .thenReturn(new AuthResponse("access", "refresh", summary));

        com.internship.platform.dto.VerifyCodeRequest request =
                new com.internship.platform.dto.VerifyCodeRequest("ada@example.com", "123456");

        mockMvc.perform(post("/api/auth/verify-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access"))
                .andExpect(jsonPath("$.refreshToken").value("refresh"))
                .andExpect(jsonPath("$.user.email").value("ada@example.com"));
    }

    @Test
    @DisplayName("POST /api/auth/resend-code returns 200 OK and ResendCodeResponse")
    void resendCodeReturnsSuccess() throws Exception {
        when(authService.resendCode(any(com.internship.platform.dto.ResendCodeRequest.class)))
                .thenReturn(new com.internship.platform.dto.ResendCodeResponse(true, "Code sent"));

        com.internship.platform.dto.ResendCodeRequest request =
                new com.internship.platform.dto.ResendCodeRequest("ada@example.com");

        mockMvc.perform(post("/api/auth/resend-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Code sent"));
    }

    @Test
    @DisplayName("POST /api/auth/login returns 200 OK and JWT tokens")
    void loginReturnsTokens() throws Exception {
        UserSummary summary = new UserSummary();
        summary.setId(1L);
        summary.setName("Ada");
        summary.setEmail("ada@example.com");
        summary.setRole(UserRole.STUDENT);
        when(authService.login(any(LoginRequest.class)))
                .thenReturn(new AuthResponse("access", "refresh", summary));

        LoginRequest request = new LoginRequest();
        request.setEmail("ada@example.com");
        request.setPassword("password1");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access"));
    }

    @Test
    @DisplayName("POST /api/auth/refresh returns new tokens")
    void refreshReturnsTokens() throws Exception {
        UserSummary summary = new UserSummary();
        summary.setId(1L);
        summary.setName("Ada");
        summary.setEmail("ada@example.com");
        summary.setRole(UserRole.STUDENT);
        when(authService.refresh("refresh"))
                .thenReturn(new AuthResponse("access-2", "refresh-2", summary));

        RefreshRequest request = new RefreshRequest();
        request.setRefreshToken("refresh");

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-2"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-2"));
    }

    @Test
    @DisplayName("GET /api/auth/me returns current user summary")
    void meReturnsUserSummary() throws Exception {
        UserSummary summary = new UserSummary();
        summary.setId(1L);
        summary.setName("Ada");
        summary.setEmail("ada@example.com");
        summary.setRole(UserRole.STUDENT);

        when(authService.me("ada@example.com")).thenReturn(summary);

        mockMvc.perform(get("/api/auth/me").principal(auth("ada@example.com", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ada@example.com"))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    @DisplayName("GET /api/auth/verify-email validates token and complies with Design Rule #4")
    void verifyEmailReturnsNotice() throws Exception {
        VerifyEmailResponse response = new VerifyEmailResponse(
                true,
                "Email address successfully verified.",
                "careers@acme.com",
                "Acme Corp"
        );

        when(emailVerificationService.verifyEmail("valid_token_123")).thenReturn(response);

        mockMvc.perform(get("/api/auth/verify-email").param("token", "valid_token_123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true))
                .andExpect(jsonPath("$.companyName").value("Acme Corp"))
                .andExpect(jsonPath("$.notice").exists());
    }

    @Test
    @DisplayName("POST /api/auth/resend-verification sends link and returns confirmation")
    void resendVerificationReturnsSuccess() throws Exception {
        ResendVerificationResponse response = new ResendVerificationResponse(
                true,
                "A fresh verification link has been sent to careers@acme.com"
        );

        when(emailVerificationService.resendVerification(eq("careers@acme.com"))).thenReturn(response);

        ResendVerificationRequest request = new ResendVerificationRequest("careers@acme.com");

        mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.notice").exists());
    }

    @Test
    @DisplayName("POST /api/auth/forgot-password returns generic success response")
    void forgotPasswordReturnsSuccess() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("student@example.com");
        ForgotPasswordResponse response = new ForgotPasswordResponse(
                true,
                "If an account with that email exists, we have sent a password reset link."
        );

        when(authService.forgotPassword(any(ForgotPasswordRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("POST /api/auth/reset-password returns success on valid reset")
    void resetPasswordReturnsSuccess() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest("reset_token_123", "NewSecret123!");
        ResetPasswordResponse response = new ResetPasswordResponse(
                true,
                "Password has been reset successfully."
        );

        when(authService.resetPassword(any(ResetPasswordRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Password has been reset successfully."));
    }

    private org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth(String username, String role) {
        return new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                username,
                "password",
                java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role))
        );
    }
}
