package com.internship.platform.controller;

import com.internship.platform.dto.InternshipResponse;
import com.internship.platform.service.InternshipService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PublicInternshipController.class)
@AutoConfigureMockMvc(addFilters = false)
class PublicInternshipControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private InternshipService internshipService;

    @Test
    @DisplayName("GET /api/internships/{id} allows public access and returns internship detail")
    void getById_publicAccess_returnsDetail() throws Exception {
        InternshipResponse response = new InternshipResponse();
        response.setId(42L);
        response.setTitle("AI Research Intern");
        response.setCompanyName("Deep Tech Labs");

        when(internshipService.getById(42L)).thenReturn(response);

        mockMvc.perform(get("/api/internships/42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.title").value("AI Research Intern"))
                .andExpect(jsonPath("$.companyName").value("Deep Tech Labs"));
    }
}
