package com.internship.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internship.platform.dto.ApplicationResponse;
import com.internship.platform.dto.ApplyRequest;
import com.internship.platform.dto.UpdateApplicationStatusRequest;
import com.internship.platform.entity.ApplicationStatus;
import com.internship.platform.service.ApplicationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ApplicationController.class)
@AutoConfigureMockMvc(addFilters = false)
class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ApplicationService applicationService;

    private UsernamePasswordAuthenticationToken auth(String email, String role) {
        return new UsernamePasswordAuthenticationToken(
                email,
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }

    @Test
    @DisplayName("POST /api/applications submits application and returns 201 Created")
    void applyReturnsCreated() throws Exception {
        ApplyRequest request = new ApplyRequest();
        request.setInternshipId(50L);

        ApplicationResponse response = new ApplicationResponse();
        response.setId(1001L);
        response.setInternshipId(50L);
        response.setStatus(ApplicationStatus.APPLIED);
        response.setAppliedAt(Instant.now());

        when(applicationService.apply(eq("student@test.edu"), any(ApplyRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/applications")
                        .principal(auth("student@test.edu", "STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1001))
                .andExpect(jsonPath("$.status").value("APPLIED"));
    }

    @Test
    @DisplayName("GET /api/applications returns list for current user")
    void getApplicationsReturnsList() throws Exception {
        ApplicationResponse response = new ApplicationResponse();
        response.setId(1001L);
        response.setStatus(ApplicationStatus.APPLIED);

        when(applicationService.getApplicationsForCurrentUser("student@test.edu", null))
                .thenReturn(List.of(response));

        mockMvc.perform(get("/api/applications").principal(auth("student@test.edu", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1001));
    }

    @Test
    @DisplayName("GET /api/applications/check/{internshipId} returns application if present")
    void checkApplicationReturnsPresent() throws Exception {
        ApplicationResponse response = new ApplicationResponse();
        response.setId(1001L);
        response.setStatus(ApplicationStatus.APPLIED);

        when(applicationService.checkApplication("student@test.edu", 50L))
                .thenReturn(Optional.of(response));

        mockMvc.perform(get("/api/applications/check/50").principal(auth("student@test.edu", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1001));
    }

    @Test
    @DisplayName("GET /api/applications/check/{internshipId} returns 204 No Content if not applied")
    void checkApplicationReturnsNoContent() throws Exception {
        when(applicationService.checkApplication("student@test.edu", 99L))
                .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/applications/check/99").principal(auth("student@test.edu", "STUDENT")))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("PUT /api/applications/{id}/status updates application status")
    void updateStatusReturnsUpdated() throws Exception {
        UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
        request.setStatus(ApplicationStatus.ACCEPTED);

        ApplicationResponse response = new ApplicationResponse();
        response.setId(1001L);
        response.setStatus(ApplicationStatus.ACCEPTED);

        when(applicationService.updateStatus(eq(1001L), eq("careers@acme.com"), any(UpdateApplicationStatusRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/applications/1001/status")
                        .principal(auth("careers@acme.com", "COMPANY"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));
    }
}
