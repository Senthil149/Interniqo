package com.internship.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internship.platform.dto.AuthResponse;
import com.internship.platform.dto.LoginRequest;
import com.internship.platform.dto.RefreshRequest;
import com.internship.platform.dto.RegisterRequest;
import com.internship.platform.dto.UserSummary;
import com.internship.platform.entity.UserRole;
import com.internship.platform.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
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
    private com.internship.platform.service.EmailVerificationService emailVerificationService;

    @Test
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
}
