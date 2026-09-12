package com.internship.platform.controller;

import com.internship.platform.dto.RiskAssessmentResponse;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.RiskLevel;
import com.internship.platform.entity.User;
import com.internship.platform.entity.UserRole;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.InternshipRepository;
import com.internship.platform.repository.UserRepository;
import com.internship.platform.service.RiskAssessmentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = RiskAssessmentController.class)
@AutoConfigureMockMvc(addFilters = false)
class RiskAssessmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RiskAssessmentService riskAssessmentService;

    @MockBean
    private InternshipRepository internshipRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private CompanyRepository companyRepository;

    @Test
    @DisplayName("GET /api/risk/{internshipId} returns risk assessment report (Design Rule #3)")
    void getRiskAssessmentReturnsReport() throws Exception {
        RiskAssessmentResponse response = new RiskAssessmentResponse();
        response.setId(1L);
        response.setInternshipId(55L);
        response.setScore(25);
        response.setLevel(RiskLevel.LOW);
        response.setReasons(java.util.List.of("Upfront or application fee requested"));

        when(riskAssessmentService.getAssessment(55L)).thenReturn(response);

        mockMvc.perform(get("/api/risk/55"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(25))
                .andExpect(jsonPath("$.level").value("LOW"))
                .andExpect(jsonPath("$.reasons").value("Upfront or application fee requested"));
    }

    @Test
    @DisplayName("POST /api/risk/analyze/{internshipId} triggers re-analysis for authorized company owner")
    @WithMockUser(username = "careers@acme.com", roles = "COMPANY")
    void analyzeRiskCompanyOwnerSuccess() throws Exception {
        Company company = new Company();
        company.setId(10L);

        User user = new User();
        user.setEmail("careers@acme.com");
        user.setRole(UserRole.COMPANY);

        Internship internship = new Internship();
        internship.setId(55L);
        internship.setCompany(company);

        when(internshipRepository.findById(55L)).thenReturn(Optional.of(internship));
        when(userRepository.findByEmail("careers@acme.com")).thenReturn(Optional.of(user));
        when(companyRepository.findByUser(user)).thenReturn(Optional.of(company));

        RiskAssessmentResponse response = new RiskAssessmentResponse();
        response.setId(2L);
        response.setInternshipId(55L);
        response.setScore(45);
        response.setLevel(RiskLevel.MEDIUM);
        response.setReasons(java.util.List.of("Mandatory training fee detected"));
        when(riskAssessmentService.analyzeInternship(55L)).thenReturn(response);

        mockMvc.perform(post("/api/risk/analyze/55").principal(auth("careers@acme.com", "COMPANY")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(45))
                .andExpect(jsonPath("$.level").value("MEDIUM"));
    }

    private org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth(String email, String role) {
        return new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                email,
                "password",
                java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role))
        );
    }
}
