package com.internship.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internship.platform.dto.*;
import com.internship.platform.entity.RiskLevel;
import com.internship.platform.entity.UserRole;
import com.internship.platform.service.AdminService;
import com.internship.platform.service.RiskAssessmentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminService adminService;

    @MockBean
    private RiskAssessmentService riskAssessmentService;

    @Test
    @DisplayName("GET /api/admin/me returns admin identity")
    void meReturnsAdminIdentity() throws Exception {
        mockMvc.perform(get("/api/admin/me").principal(auth("admin@interniqo.com", "ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.email").value("admin@interniqo.com"));
    }

    @Test
    @DisplayName("GET /api/admin/metrics returns platform overview metrics")
    void getMetricsReturnsOverview() throws Exception {
        AdminMetricsResponse metrics = new AdminMetricsResponse();
        metrics.setTotalUsers(100);
        metrics.setTotalStudents(70);
        metrics.setTotalCompanies(25);
        metrics.setTotalAdmins(5);
        metrics.setTotalInternships(40);
        metrics.setHighRiskPostings(5);
        when(adminService.getMetrics()).thenReturn(metrics);

        mockMvc.perform(get("/api/admin/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(100))
                .andExpect(jsonPath("$.totalStudents").value(70))
                .andExpect(jsonPath("$.totalCompanies").value(25))
                .andExpect(jsonPath("$.highRiskPostings").value(5));
    }

    @Test
    @DisplayName("GET /api/admin/users lists platform users")
    void getUsersReturnsList() throws Exception {
        AdminUserResponse user = new AdminUserResponse();
        user.setId(1L);
        user.setName("Alice");
        user.setEmail("alice@example.com");
        user.setRole(UserRole.STUDENT);
        user.setCreatedAt(Instant.now());

        when(adminService.getUsers(null)).thenReturn(List.of(user));

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("alice@example.com"));
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id}/role updates user role")
    void updateUserRoleReturnsUpdated() throws Exception {
        AdminUpdateUserRoleRequest request = new AdminUpdateUserRoleRequest();
        request.setRole(UserRole.COMPANY);

        AdminUserResponse updated = new AdminUserResponse();
        updated.setId(1L);
        updated.setEmail("alice@example.com");
        updated.setRole(UserRole.COMPANY);

        when(adminService.updateUserRole(eq(1L), eq(UserRole.COMPANY), eq("admin@interniqo.com")))
                .thenReturn(updated);

        mockMvc.perform(put("/api/admin/users/1/role")
                        .principal(auth("admin@interniqo.com", "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("COMPANY"));
    }

    private org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth(String email, String role) {
        return new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                email,
                "password",
                java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role))
        );
    }

    @Test
    @DisplayName("GET /api/admin/companies lists companies")
    @WithMockUser(roles = "ADMIN")
    void getCompaniesReturnsList() throws Exception {
        AdminCompanyResponse company = new AdminCompanyResponse();
        company.setId(10L);
        company.setCompanyName("Acme Corp");
        company.setEmail("careers@acme.com");
        company.setEmailVerified(true);

        when(adminService.getCompanies()).thenReturn(List.of(company));

        mockMvc.perform(get("/api/admin/companies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].companyName").value("Acme Corp"))
                .andExpect(jsonPath("$[0].emailVerified").value(true));
    }

    @Test
    @DisplayName("PUT /api/admin/companies/{id}/verification overrides company email verification")
    @WithMockUser(roles = "ADMIN")
    void toggleCompanyVerificationReturnsUpdated() throws Exception {
        AdminToggleCompanyVerificationRequest request = new AdminToggleCompanyVerificationRequest();
        request.setVerified(true);

        AdminCompanyResponse updated = new AdminCompanyResponse();
        updated.setId(10L);
        updated.setCompanyName("Acme Corp");
        updated.setEmailVerified(true);

        when(adminService.toggleCompanyVerification(10L, true)).thenReturn(updated);

        mockMvc.perform(put("/api/admin/companies/10/verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailVerified").value(true));
    }

    @Test
    @DisplayName("GET /api/admin/risk/flagged returns high and medium risk postings")
    @WithMockUser(roles = "ADMIN")
    void getFlaggedInternshipsReturnsList() throws Exception {
        AdminFlaggedInternshipResponse flagged = new AdminFlaggedInternshipResponse();
        flagged.setInternshipId(101L);
        flagged.setTitle("Suspicious Posting");
        flagged.setRiskScore(80);
        flagged.setRiskLevel(RiskLevel.HIGH);

        when(adminService.getFlaggedInternships()).thenReturn(List.of(flagged));

        mockMvc.perform(get("/api/admin/risk/flagged"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].riskScore").value(80))
                .andExpect(jsonPath("$[0].riskLevel").value("HIGH"));
    }

    @Test
    @DisplayName("GET /api/admin/verifications/email returns email audit logs")
    @WithMockUser(roles = "ADMIN")
    void getEmailVerificationsReturnsList() throws Exception {
        AdminEmailVerificationResponse log = new AdminEmailVerificationResponse();
        log.setId(1L);
        log.setTargetName("Acme Corp");
        log.setExpired(false);

        when(adminService.getEmailVerifications()).thenReturn(List.of(log));

        mockMvc.perform(get("/api/admin/verifications/email"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].targetName").value("Acme Corp"))
                .andExpect(jsonPath("$[0].expired").value(false));
    }

    @Test
    @DisplayName("GET /api/admin/verifications/blockchain returns credential ledger audit logs")
    @WithMockUser(roles = "ADMIN")
    void getBlockchainRecordsReturnsList() throws Exception {
        AdminBlockchainRecordResponse record = new AdminBlockchainRecordResponse();
        record.setId(1L);
        record.setCredentialId("CRED-12345");
        record.setStudentName("Alice");
        record.setCompanyName("Acme");

        when(adminService.getBlockchainRecords()).thenReturn(List.of(record));

        mockMvc.perform(get("/api/admin/verifications/blockchain"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].credentialId").value("CRED-12345"));
    }
}
