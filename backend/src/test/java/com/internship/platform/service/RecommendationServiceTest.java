package com.internship.platform.service;

import com.internship.platform.client.AiServiceClient;
import com.internship.platform.dto.InternshipSearchParams;
import com.internship.platform.dto.MatchInternshipItem;
import com.internship.platform.dto.MatchResponse;
import com.internship.platform.dto.MatchResultItem;
import com.internship.platform.dto.RecommendationListResponse;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.Recommendation;
import com.internship.platform.entity.Student;
import com.internship.platform.entity.User;
import com.internship.platform.entity.UserRole;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.InternshipRepository;
import com.internship.platform.repository.RecommendationRepository;
import com.internship.platform.repository.RiskAssessmentRepository;
import com.internship.platform.repository.StudentRepository;
import com.internship.platform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private InternshipRepository internshipRepository;

    @Mock
    private RecommendationRepository recommendationRepository;

    @Mock
    private RiskAssessmentRepository riskAssessmentRepository;

    @Mock
    private AiServiceClient aiServiceClient;

    @InjectMocks
    private RecommendationService recommendationService;

    private User studentUser;
    private Student student;
    private Internship internship1;
    private Internship internship2;

    @BeforeEach
    void setUp() {
        studentUser = new User();
        studentUser.setId(1L);
        studentUser.setEmail("student@test.edu");
        studentUser.setRole(UserRole.STUDENT);

        student = new Student();
        student.setId(10L);
        student.setUser(studentUser);
        student.setSkills("Java, Python, Spring Boot");
        student.setEducation("B.Tech Computer Science");
        student.setResumePath("/uploads/resumes/student_10.pdf");

        Company company = new Company();
        company.setId(100L);
        company.setCompanyName("Alpha Corp");

        internship1 = new Internship();
        internship1.setId(501L);
        internship1.setCompany(company);
        internship1.setTitle("Java Backend Intern");
        internship1.setDescription("Work on Spring Boot microservices");
        internship1.setRequiredSkills("Java, Spring");
        internship1.setCountry("USA");
        internship1.setWorkMode("REMOTE");
        internship1.setStipend(new BigDecimal("2500"));
        internship1.setStatus("OPEN");

        internship2 = new Internship();
        internship2.setId(502L);
        internship2.setCompany(company);
        internship2.setTitle("Data Engineering Intern");
        internship2.setDescription("Work on Python data pipelines");
        internship2.setRequiredSkills("Python, SQL");
        internship2.setCountry("USA");
        internship2.setWorkMode("REMOTE");
        internship2.setStipend(new BigDecimal("2200"));
        internship2.setStatus("OPEN");
    }

    @Test
    @DisplayName("generateRecommendations: If student has no profile or resume data, returns hasProfile=false without erroring")
    void generateRecommendations_noProfile_returnsNoProfileStatus() {
        Student emptyStudent = new Student();
        emptyStudent.setId(11L);
        emptyStudent.setUser(studentUser);

        when(userRepository.findByEmail("student@test.edu")).thenReturn(Optional.of(studentUser));
        when(studentRepository.findByUser(studentUser)).thenReturn(Optional.of(emptyStudent));

        RecommendationListResponse response = recommendationService.generateRecommendations("student@test.edu", null);

        assertNotNull(response);
        assertFalse(response.isHasProfile());
        assertTrue(response.getMessage().contains("upload your resume first"));
        verifyNoInteractions(internshipRepository, aiServiceClient, recommendationRepository);
    }

    @Test
    @DisplayName("generateRecommendations: Complies with Design Rule #1 (hard filters before AI) and Design Rule #2 (raw score ranking)")
    void generateRecommendations_satisfiesDesignRules1And2() {
        when(userRepository.findByEmail("student@test.edu")).thenReturn(Optional.of(studentUser));
        when(studentRepository.findByUser(studentUser)).thenReturn(Optional.of(student));

        // Step 1: Hard filters return eligible postings
        when(internshipRepository.findAll(any(Specification.class)))
                .thenReturn(List.of(internship1, internship2));

        // Step 2 & 3: SBERT returns raw cosine similarity scores
        MatchResultItem match1 = new MatchResultItem(501L, 0.88);
        MatchResultItem match2 = new MatchResultItem(502L, 0.74);
        MatchResponse aiMatch = new MatchResponse(List.of(match1, match2), true);

        when(aiServiceClient.match(anyString(), anyList()))
                .thenReturn(Optional.of(aiMatch));

        RecommendationListResponse response = recommendationService.generateRecommendations("student@test.edu", new InternshipSearchParams());

        assertNotNull(response);
        assertTrue(response.isHasProfile());
        assertEquals(2, response.getRecommendations().size());

        // Verify Design Rule #2: Raw cosine similarity score stored and returned
        assertEquals(0.88, response.getRecommendations().get(0).getSimilarityScore());
        assertEquals(1, response.getRecommendations().get(0).getRanking());
        assertEquals(0.74, response.getRecommendations().get(1).getSimilarityScore());
        assertEquals(2, response.getRecommendations().get(1).getRanking());

        // Verify recommendations persisted in database
        verify(recommendationRepository, times(1)).deleteByStudent(student);
        verify(recommendationRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("generateRecommendations: Throws SERVICE_UNAVAILABLE if Python AI microservice is offline")
    void generateRecommendations_aiServiceDown_throwsServiceUnavailable() {
        when(userRepository.findByEmail("student@test.edu")).thenReturn(Optional.of(studentUser));
        when(studentRepository.findByUser(studentUser)).thenReturn(Optional.of(student));
        when(internshipRepository.findAll(any(Specification.class)))
                .thenReturn(List.of(internship1));
        when(aiServiceClient.match(anyString(), anyList()))
                .thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class,
                () -> recommendationService.generateRecommendations("student@test.edu", null));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatus());
        assertTrue(ex.getMessage().contains("AI recommendation service is temporarily unavailable"));
        verify(recommendationRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("generateRecommendations: When no internships match hard filters, returns empty recommendations")
    void generateRecommendations_noMatchingPostings_returnsEmpty() {
        when(userRepository.findByEmail("student@test.edu")).thenReturn(Optional.of(studentUser));
        when(studentRepository.findByUser(studentUser)).thenReturn(Optional.of(student));
        when(internshipRepository.findAll(any(Specification.class)))
                .thenReturn(Collections.emptyList());

        RecommendationListResponse response = recommendationService.generateRecommendations("student@test.edu", null);

        assertNotNull(response);
        assertTrue(response.isHasProfile());
        assertTrue(response.getRecommendations().isEmpty());
        verifyNoInteractions(aiServiceClient);
    }

    @Test
    @DisplayName("getRecommendations: Returns stored recommendations for student")
    void getRecommendations_returnsStoredList() {
        Recommendation rec = new Recommendation(student, internship1, 0.82, 1, Instant.now());

        when(userRepository.findByEmail("student@test.edu")).thenReturn(Optional.of(studentUser));
        when(studentRepository.findByUser(studentUser)).thenReturn(Optional.of(student));
        when(recommendationRepository.findByStudentOrderByRankingAsc(student)).thenReturn(List.of(rec));
        when(riskAssessmentRepository.findTopByInternshipOrderByCreatedAtDesc(internship1))
                .thenReturn(Optional.empty());

        RecommendationListResponse response = recommendationService.getRecommendations("student@test.edu");

        assertNotNull(response);
        assertTrue(response.isHasProfile());
        assertEquals(1, response.getRecommendations().size());
        assertEquals(0.82, response.getRecommendations().get(0).getSimilarityScore());
        assertEquals("Java Backend Intern", response.getRecommendations().get(0).getTitle());
    }
}
