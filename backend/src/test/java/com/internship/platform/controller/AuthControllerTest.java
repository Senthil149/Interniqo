package com.internship.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internship.platform.dto.AuthResponse;
import com.internship.platform.dto.LoginRequest;
import com.internship.platform.dto.RefreshRequest;
import com.internship.platform.dto.RegisterRequest;
import com.internship.platform.dto.ResendVerificationRequest;
import com.internship.platform.dto.ResendVerificationResponse;
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
    @DisplayName("POST /api/auth/register returns 201 Created and JWT tokens")
    void registerReturnsCreatedTokens() throws Exception {
        UserSummary summary = new UserSummary();
        summary.setId(1L);
        summary.setName("Ada");
        summary.setEmail("ada@example.com");
        summary.setRole(UserRole.STUDENT);
        when(authService.register(any(RegisterRequest.class)))
                .thenReturn(new AuthResponse("access", "refresh", summary));

        RegisterRequest request = new RegisterRequest();
        request.setName("Ada");
        request.setEmail("ada@example.com");
        request.setPassword("password1");
        request.setRole(UserRole.STUDENT);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("access"))
                .andExpect(jsonPath("$.refreshToken").value("refresh"))
                .andExpect(jsonPath("$.user.role").value("STUDENT"));
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

    private org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth(String username, String role) {
        return new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                username,
                "password",
                java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role))
        );
    }
}
