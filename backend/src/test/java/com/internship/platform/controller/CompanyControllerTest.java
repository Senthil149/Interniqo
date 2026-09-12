package com.internship.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internship.platform.dto.InternshipRequest;
import com.internship.platform.dto.InternshipResponse;
import com.internship.platform.service.InternshipService;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = CompanyController.class)
@AutoConfigureMockMvc(addFilters = false)
class CompanyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InternshipService internshipService;

    private UsernamePasswordAuthenticationToken auth(String email, String role) {
        return new UsernamePasswordAuthenticationToken(
                email,
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }

    @Test
    @DisplayName("GET /api/company/me returns company identity")
    void meReturnsCompanyIdentity() throws Exception {
        mockMvc.perform(get("/api/company/me").principal(auth("careers@acme.com", "COMPANY")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("COMPANY"))
                .andExpect(jsonPath("$.email").value("careers@acme.com"));
    }

    @Test
    @DisplayName("POST /api/company/internships creates internship and returns 201 Created")
    void createInternshipReturnsCreated() throws Exception {
        InternshipRequest request = new InternshipRequest();
        request.setTitle("Cloud Architect Intern");
        request.setDescription("Design serverless architectures on AWS");
        request.setRequiredSkills("AWS, Terraform, Go");
        request.setCountry("USA");
        request.setWorkMode("REMOTE");
        request.setDuration("6 months");
        request.setStipend(new BigDecimal("3500"));
        request.setCurrency("USD");
        request.setDeadline(LocalDate.now().plusMonths(3));

        InternshipResponse response = new InternshipResponse();
        response.setId(101L);
        response.setTitle("Cloud Architect Intern");
        response.setStatus("OPEN");

        when(internshipService.create(eq("careers@acme.com"), any(InternshipRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/company/internships")
                        .principal(auth("careers@acme.com", "COMPANY"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(101))
                .andExpect(jsonPath("$.title").value("Cloud Architect Intern"))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    @DisplayName("GET /api/company/internships lists postings for current company")
    void myListingsReturnsItems() throws Exception {
        InternshipResponse item = new InternshipResponse();
        item.setId(101L);
        item.setTitle("Cloud Architect Intern");

        when(internshipService.getMyListings("careers@acme.com")).thenReturn(List.of(item));

        mockMvc.perform(get("/api/company/internships").principal(auth("careers@acme.com", "COMPANY")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(101));
    }

    @Test
    @DisplayName("GET /api/company/internships/{id} returns single posting")
    void getInternshipReturnsItem() throws Exception {
        InternshipResponse item = new InternshipResponse();
        item.setId(101L);
        item.setTitle("Cloud Architect Intern");

        when(internshipService.getByIdForCompany(101L, "careers@acme.com")).thenReturn(item);

        mockMvc.perform(get("/api/company/internships/101").principal(auth("careers@acme.com", "COMPANY")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(101));
    }

    @Test
    @DisplayName("PUT /api/company/internships/{id} updates posting")
    void updateInternshipReturnsUpdated() throws Exception {
        InternshipRequest request = new InternshipRequest();
        request.setTitle("Senior Cloud Architect Intern");
        request.setCountry("USA");
        request.setWorkMode("REMOTE");

        InternshipResponse updated = new InternshipResponse();
        updated.setId(101L);
        updated.setTitle("Senior Cloud Architect Intern");

        when(internshipService.update(eq(101L), eq("careers@acme.com"), any(InternshipRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/company/internships/101")
                        .principal(auth("careers@acme.com", "COMPANY"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Senior Cloud Architect Intern"));
    }

    @Test
    @DisplayName("DELETE /api/company/internships/{id} deletes posting and returns 204 No Content")
    void deleteInternshipReturnsNoContent() throws Exception {
        doNothing().when(internshipService).delete(101L, "careers@acme.com");

        mockMvc.perform(delete("/api/company/internships/101").principal(auth("careers@acme.com", "COMPANY")))
                .andExpect(status().isNoContent());
    }
}
