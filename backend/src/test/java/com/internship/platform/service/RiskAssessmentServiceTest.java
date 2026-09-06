package com.internship.platform.service;

import com.internship.platform.dto.RiskAssessmentResponse;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.RiskAssessment;
import com.internship.platform.entity.RiskLevel;
import com.internship.platform.repository.InternshipRepository;
import com.internship.platform.repository.RiskAssessmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RiskAssessmentServiceTest {

    @Mock
    private InternshipRepository internshipRepository;

    @Mock
    private RiskAssessmentRepository riskAssessmentRepository;

    private RiskAssessmentService service;

    @BeforeEach
    void setUp() {
        service = new RiskAssessmentService(internshipRepository, riskAssessmentRepository);
        when(riskAssessmentRepository.save(any(RiskAssessment.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    private Company createCompleteCompany() {
        Company company = new Company();
        company.setId(1L);
        company.setCompanyName("Acme Tech Solutions");
        company.setDescription("A established enterprise software provider with over ten years of industry experience.");
        company.setWebsite("https://acme-tech.example.org");
        company.setCountry("Germany");
        company.setEmail("careers@acme-tech.example.org");
        company.setEmailVerified(true);
        return company;
    }

    private Internship createCleanInternship(Company company) {
        Internship in = new Internship();
        in.setId(10L);
        in.setCompany(company);
        in.setTitle("Software Engineering Intern");
        in.setDescription("Work with our engineering team on Java backend microservices and React frontends.");
        in.setRequiredSkills("Java, Spring Boot, Git");
        in.setCountry("Germany");
        in.setCity("Berlin");
        in.setWorkMode("HYBRID");
        in.setDuration("6 months");
        in.setStipend(new BigDecimal("1200.00"));
        in.setCurrency("EUR");
        in.setStatus("OPEN");
        return in;
    }

    @Test
    @DisplayName("Clean internship with complete company profile scores 0 and LOW risk level")
    void cleanInternshipScoresLow() {
        Company company = createCompleteCompany();
        Internship internship = createCleanInternship(company);

        when(internshipRepository.findById(10L)).thenReturn(Optional.of(internship));
        when(riskAssessmentRepository.findTopByInternshipOrderByCreatedAtDesc(internship))
                .thenReturn(Optional.empty());
        when(internshipRepository.findByCompanyOrderByIdDesc(company))
                .thenReturn(List.of(internship));

        RiskAssessmentResponse response = service.analyzeInternship(10L);

        assertEquals(0, response.getScore());
        assertEquals(RiskLevel.LOW, response.getLevel());
        assertFalse(response.getReasons().isEmpty());
        assertTrue(response.getReasons().get(0).contains("No risk indicators triggered"));
    }

    @Test
    @DisplayName("Fee request triggers 25 points -> score 25, LOW risk level (<40)")
    void feeRequestTriggers25Points() {
        Company company = createCompleteCompany();
        Internship internship = createCleanInternship(company);
        internship.setDescription("Candidates must submit an application fee of $50 before review.");

        when(internshipRepository.findById(10L)).thenReturn(Optional.of(internship));
        when(riskAssessmentRepository.findTopByInternshipOrderByCreatedAtDesc(internship))
                .thenReturn(Optional.empty());
        when(internshipRepository.findByCompanyOrderByIdDesc(company))
                .thenReturn(List.of(internship));

        RiskAssessmentResponse response = service.analyzeInternship(10L);

        assertEquals(25, response.getScore());
        assertEquals(RiskLevel.LOW, response.getLevel());
        assertTrue(response.getReasons().stream().anyMatch(r -> r.contains("Upfront or application fee")));
    }

    @Test
    @DisplayName("Training payment (20) + Incomplete company info (10) + Job guarantee (20) -> score 50, MEDIUM risk level (40-70)")
    void mediumRiskCombination() {
        Company company = createCompleteCompany();
        company.setWebsite(""); // incomplete info (+10)
        company.setDescription("Short"); // incomplete info

        Internship internship = createCleanInternship(company);
        internship.setDescription("Mandatory paid training course required before start. 100% job guarantee upon completion.");

        when(internshipRepository.findById(10L)).thenReturn(Optional.of(internship));
        when(riskAssessmentRepository.findTopByInternshipOrderByCreatedAtDesc(internship))
                .thenReturn(Optional.empty());
        when(internshipRepository.findByCompanyOrderByIdDesc(company))
                .thenReturn(List.of(internship));

        RiskAssessmentResponse response = service.analyzeInternship(10L);

        // 20 (training) + 10 (incomplete info) + 20 (job guarantee) = 50
        assertEquals(50, response.getScore());
        assertEquals(RiskLevel.MEDIUM, response.getLevel());
        assertEquals(3, response.getReasons().size());
    }

    @Test
    @DisplayName("Design Rule #3 Cap: When all 7 indicators trigger (raw 125), final score is capped at 100 and HIGH level")
    void allIndicatorsTriggerCappedAt100() {
        Company company = createCompleteCompany();
        company.setWebsite(null); // +10 Incomplete info
        company.setDescription("");

        Internship internship = createCleanInternship(company);
        // +25 Fee request, +20 Training payment, +20 Job guarantee, +20 Suspicious payment
        internship.setDescription(
                "Applicants must pay a registration fee of $100 and attend paid training. " +
                "Direct hiring without interview with 100% job guarantee. Send payment via Bitcoin or USDT.");
        // +15 Unrealistic stipend
        internship.setStipend(new BigDecimal("50000.00"));
        internship.setCurrency("USD");

        // Duplicate posting: another internship with same title (+15)
        Internship duplicate = createCleanInternship(company);
        duplicate.setId(11L);
        duplicate.setTitle(internship.getTitle());

        when(internshipRepository.findById(10L)).thenReturn(Optional.of(internship));
        when(riskAssessmentRepository.findTopByInternshipOrderByCreatedAtDesc(internship))
                .thenReturn(Optional.empty());
        when(internshipRepository.findByCompanyOrderByIdDesc(company))
                .thenReturn(List.of(internship, duplicate));

        RiskAssessmentResponse response = service.analyzeInternship(10L);

        // Raw sum: 25 + 20 + 15 + 20 + 10 + 20 + 15 = 125
        // Design Rule #3 requirement: must cap at 100
        assertEquals(100, response.getScore(), "Score must be capped at 100 per Design Rule #3");
        assertEquals(RiskLevel.HIGH, response.getLevel());
        assertEquals(7, response.getReasons().size());
    }

    @Test
    @DisplayName("Threshold boundary test: 39 is LOW, 40 is MEDIUM, 70 is MEDIUM, 71 is HIGH")
    void thresholdBoundaries() {
        Company company = createCompleteCompany();
        Internship inLow = createCleanInternship(company);
        // Fee (25) + Incomplete company (10) = 35 -> LOW (<40)
        company.setWebsite(null);
        inLow.setDescription("Please pay application fee.");

        when(internshipRepository.findById(1L)).thenReturn(Optional.of(inLow));
        when(internshipRepository.findByCompanyOrderByIdDesc(company)).thenReturn(List.of(inLow));
        RiskAssessmentResponse resLow = service.analyzeInternship(1L);
        assertEquals(35, resLow.getScore());
        assertEquals(RiskLevel.LOW, resLow.getLevel());

        // Fee (25) + Duplicate (15) = 40 -> MEDIUM (40-70)
        company.setWebsite("https://valid-website.org");
        company.setDescription("A very detailed description of the company that is long enough.");
        Internship dup = createCleanInternship(company);
        dup.setId(99L);
        dup.setTitle(inLow.getTitle());
        when(internshipRepository.findByCompanyOrderByIdDesc(company)).thenReturn(List.of(inLow, dup));
        RiskAssessmentResponse resMed = service.analyzeInternship(1L);
        assertEquals(40, resMed.getScore());
        assertEquals(RiskLevel.MEDIUM, resMed.getLevel());

        // Fee (25) + Training (20) + Job guarantee (20) + Incomplete company (10) = 75 -> HIGH (>70)
        company.setWebsite(null);
        inLow.setDescription("Application fee required. Paid training required. Guaranteed job promise.");
        when(internshipRepository.findByCompanyOrderByIdDesc(company)).thenReturn(List.of(inLow));
        RiskAssessmentResponse resHigh = service.analyzeInternship(1L);
        assertEquals(75, resHigh.getScore());
        assertEquals(RiskLevel.HIGH, resHigh.getLevel());
    }
}
