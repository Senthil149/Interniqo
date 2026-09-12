package com.internship.platform.service;

import com.internship.platform.dto.InternshipRequest;
import com.internship.platform.dto.InternshipResponse;
import com.internship.platform.dto.InternshipSearchParams;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.RiskAssessment;
import com.internship.platform.entity.RiskLevel;
import com.internship.platform.entity.User;
import com.internship.platform.entity.UserRole;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.InternshipRepository;
import com.internship.platform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InternshipServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private InternshipRepository internshipRepository;

    @Mock
    private RiskAssessmentService riskAssessmentService;

    @InjectMocks
    private InternshipService internshipService;

    private User companyUser;
    private Company company;
    private Internship internship;

    @BeforeEach
    void setUp() {
        companyUser = new User();
        companyUser.setId(10L);
        companyUser.setEmail("careers@acme.com");
        companyUser.setRole(UserRole.COMPANY);

        company = new Company();
        company.setId(20L);
        company.setCompanyName("Acme Corp");
        company.setEmail("careers@acme.com");
        company.setUser(companyUser);

        internship = new Internship();
        internship.setId(100L);
        internship.setCompany(company);
        internship.setTitle("Full Stack Engineer Intern");
        internship.setDescription("Exciting opportunity to build cloud-native services.");
        internship.setRequiredSkills("Java, React, SQL");
        internship.setCountry("United States");
        internship.setCity("San Francisco");
        internship.setWorkMode("HYBRID");
        internship.setDuration("3 months");
        internship.setStipend(new BigDecimal("3000.00"));
        internship.setCurrency("USD");
        internship.setEligibility("Enrolled in CS degree");
        internship.setVisaInformation("J-1 sponsorship available");
        internship.setDeadline(LocalDate.now().plusMonths(2));
        internship.setStatus("OPEN");
    }

    @Test
    @DisplayName("create: Saves new internship as OPEN and triggers automated risk assessment")
    void create_success() {
        InternshipRequest request = new InternshipRequest();
        request.setTitle("Full Stack Engineer Intern");
        request.setDescription("Exciting opportunity to build cloud-native services.");
        request.setRequiredSkills("Java, React, SQL");
        request.setCountry("United States");
        request.setCity("San Francisco");
        request.setWorkMode("HYBRID");
        request.setDuration("3 months");
        request.setStipend(new BigDecimal("3000.00"));
        request.setCurrency("USD");
        request.setEligibility("Enrolled in CS degree");
        request.setVisaInformation("J-1 sponsorship available");
        request.setDeadline(LocalDate.now().plusMonths(2));

        when(userRepository.findByEmail("careers@acme.com")).thenReturn(Optional.of(companyUser));
        when(companyRepository.findByUser(companyUser)).thenReturn(Optional.of(company));
        when(internshipRepository.save(any(Internship.class))).thenAnswer(invocation -> {
            Internship in = invocation.getArgument(0);
            in.setId(100L);
            return in;
        });

        RiskAssessment risk = new RiskAssessment();
        risk.setScore(10);
        risk.setLevel(RiskLevel.LOW);
        when(riskAssessmentService.getAssessmentEntity(any(Internship.class))).thenReturn(Optional.of(risk));

        InternshipResponse response = internshipService.create("careers@acme.com", request);

        assertNotNull(response);
        assertEquals("OPEN", response.getStatus());
        assertNotNull(response.getRiskScore());
        assertEquals(10, response.getRiskScore());
        assertEquals("LOW", response.getRiskLevel());

        verify(riskAssessmentService, times(1)).analyzeInternship(100L);
    }

    @Test
    @DisplayName("getMyListings: Returns all listings owned by the authenticated company")
    void getMyListings_returnsCompanyListings() {
        when(userRepository.findByEmail("careers@acme.com")).thenReturn(Optional.of(companyUser));
        when(companyRepository.findByUser(companyUser)).thenReturn(Optional.of(company));
        when(internshipRepository.findByCompanyOrderByIdDesc(company)).thenReturn(List.of(internship));

        List<InternshipResponse> listings = internshipService.getMyListings("careers@acme.com");

        assertNotNull(listings);
        assertEquals(1, listings.size());
        assertEquals("Full Stack Engineer Intern", listings.get(0).getTitle());
    }

    @Test
    @DisplayName("getByIdForCompany: Allows company owner to fetch internship")
    void getByIdForCompany_owner_success() {
        when(internshipRepository.findById(100L)).thenReturn(Optional.of(internship));
        when(userRepository.findByEmail("careers@acme.com")).thenReturn(Optional.of(companyUser));
        when(companyRepository.findByUser(companyUser)).thenReturn(Optional.of(company));

        InternshipResponse response = internshipService.getByIdForCompany(100L, "careers@acme.com");

        assertNotNull(response);
        assertEquals(100L, response.getId());
    }

    @Test
    @DisplayName("getByIdForCompany: Different company attempting access throws FORBIDDEN")
    void getByIdForCompany_notOwner_throwsForbidden() {
        Company otherCompany = new Company();
        otherCompany.setId(99L);
        otherCompany.setCompanyName("Competitor LLC");

        when(internshipRepository.findById(100L)).thenReturn(Optional.of(internship));
        when(userRepository.findByEmail("other@competitor.com")).thenReturn(Optional.of(companyUser));
        when(companyRepository.findByUser(companyUser)).thenReturn(Optional.of(otherCompany));

        ApiException ex = assertThrows(ApiException.class,
                () -> internshipService.getByIdForCompany(100L, "other@competitor.com"));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    @DisplayName("update: Company owner updates internship and re-triggers risk assessment")
    void update_owner_success() {
        InternshipRequest request = new InternshipRequest();
        request.setTitle("Senior Full Stack Engineer Intern");
        request.setWorkMode("REMOTE");
        request.setCountry("United States");
        request.setStatus("CLOSED");

        when(internshipRepository.findById(100L)).thenReturn(Optional.of(internship));
        when(userRepository.findByEmail("careers@acme.com")).thenReturn(Optional.of(companyUser));
        when(companyRepository.findByUser(companyUser)).thenReturn(Optional.of(company));
        when(internshipRepository.save(any(Internship.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InternshipResponse response = internshipService.update(100L, "careers@acme.com", request);

        assertNotNull(response);
        assertEquals("Senior Full Stack Engineer Intern", response.getTitle());
        assertEquals("REMOTE", response.getWorkMode());
        assertEquals("CLOSED", response.getStatus());

        verify(riskAssessmentService, times(1)).analyzeInternship(100L);
    }

    @Test
    @DisplayName("delete: Company owner deletes internship")
    void delete_owner_success() {
        when(internshipRepository.findById(100L)).thenReturn(Optional.of(internship));
        when(userRepository.findByEmail("careers@acme.com")).thenReturn(Optional.of(companyUser));
        when(companyRepository.findByUser(companyUser)).thenReturn(Optional.of(company));

        internshipService.delete(100L, "careers@acme.com");

        verify(internshipRepository, times(1)).delete(internship);
    }

    @Test
    @DisplayName("search: Applies structured filters to repository")
    void search_appliesSpecification() {
        InternshipSearchParams params = new InternshipSearchParams();
        params.setCountry("United States");
        params.setWorkMode("HYBRID");
        Pageable pageable = PageRequest.of(0, 10);

        Page<Internship> page = new PageImpl<>(List.of(internship), pageable, 1);
        when(internshipRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        Page<InternshipResponse> result = internshipService.search(params, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Full Stack Engineer Intern", result.getContent().get(0).getTitle());
    }
}
