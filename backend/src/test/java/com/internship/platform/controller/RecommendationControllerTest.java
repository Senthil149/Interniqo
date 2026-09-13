package com.internship.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internship.platform.dto.InternshipSearchParams;
import com.internship.platform.dto.RecommendationItemResponse;
import com.internship.platform.dto.RecommendationListResponse;
import com.internship.platform.service.RecommendationService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = RecommendationController.class)
@AutoConfigureMockMvc(addFilters = false)
class RecommendationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RecommendationService recommendationService;

    private UsernamePasswordAuthenticationToken auth(String email, String role) {
        return new UsernamePasswordAuthenticationToken(
                email,
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }

    @Test
    @DisplayName("GET /api/recommendations returns stored rankings for student")
    void getRecommendationsReturnsItems() throws Exception {
        RecommendationItemResponse item = new RecommendationItemResponse();
        item.setInternshipId(10L);
        item.setTitle("ML Engineer Intern");
        item.setSimilarityScore(0.89);
        item.setRanking(1);

        RecommendationListResponse listResponse = RecommendationListResponse.success(List.of(item), Instant.now());
        when(recommendationService.getRecommendations("student@test.edu")).thenReturn(listResponse);

        mockMvc.perform(get("/api/recommendations").principal(auth("student@test.edu", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasProfile").value(true))
                .andExpect(jsonPath("$.recommendations[0].similarityScore").value(0.89))
                .andExpect(jsonPath("$.recommendations[0].ranking").value(1));
    }

    @Test
    @DisplayName("POST /api/recommendations/generate accepts filters and generates new rankings")
    void generateRecommendationsReturnsRanked() throws Exception {
        InternshipSearchParams params = new InternshipSearchParams();
        params.setCountry("Germany");

        RecommendationItemResponse item = new RecommendationItemResponse();
        item.setInternshipId(20L);
        item.setTitle("Backend Engineer Intern");
        item.setSimilarityScore(0.92);
        item.setRanking(1);

        RecommendationListResponse listResponse = RecommendationListResponse.success(List.of(item), Instant.now());
        when(recommendationService.generateRecommendations(eq("student@test.edu"), any())).thenReturn(listResponse);

        mockMvc.perform(post("/api/recommendations/generate")
                        .principal(auth("student@test.edu", "STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(params)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasProfile").value(true))
                .andExpect(jsonPath("$.recommendations[0].similarityScore").value(0.92))
                .andExpect(jsonPath("$.recommendations[0].title").value("Backend Engineer Intern"));
    }

    @Test
    @DisplayName("GET /api/recommendations/dashboard returns live metrics and top recommendations")
    void getStudentDashboardReturnsMetrics() throws Exception {
        com.internship.platform.dto.StudentRecommendationDashboardResponse dashboard =
                new com.internship.platform.dto.StudentRecommendationDashboardResponse();
        dashboard.setHasProfile(true);
        dashboard.setTotalRecommended(5);
        dashboard.setTotalApplied(2);
        dashboard.setTotalShortlisted(1);
        dashboard.setTotalAccepted(0);
        dashboard.setTotalSaved(0);
        dashboard.setTopMatchScore(0.87);
        dashboard.setTopMatchFitLevel("Best Match");

        when(recommendationService.getStudentDashboard("student@test.edu")).thenReturn(dashboard);

        mockMvc.perform(get("/api/recommendations/dashboard").principal(auth("student@test.edu", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasProfile").value(true))
                .andExpect(jsonPath("$.totalRecommended").value(5))
                .andExpect(jsonPath("$.totalApplied").value(2))
                .andExpect(jsonPath("$.totalShortlisted").value(1))
                .andExpect(jsonPath("$.topMatchScore").value(0.87))
                .andExpect(jsonPath("$.topMatchFitLevel").value("Best Match"));
    }
}
