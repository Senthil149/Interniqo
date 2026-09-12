package com.internship.platform.service;

import com.internship.platform.dto.CompanyProfileRequest;
import com.internship.platform.dto.CompanyProfileResponse;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.User;
import com.internship.platform.entity.UserRole;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private UserRepository userRepository;

    private DomainQualityService domainQualityService;
    private CompanyService companyService;

    @BeforeEach
    void setUp() {
        domainQualityService = new DomainQualityService();
        companyService = new CompanyService(companyRepository, userRepository, domainQualityService);
    }

    @Test
    @DisplayName("getProfile returns company profile with domain signals and Design Rule #4 notice")
    void getProfile_returnsDetailsAndNotice() {
        String email = "contact@uber.com";
        User user = new User();
        user.setEmail(email);
        user.setName("Uber Technologies");
        user.setRole(UserRole.COMPANY);

        Company company = new Company();
        company.setId(10L);
        company.setUser(user);
        company.setCompanyName("Uber Technologies");
        company.setEmail(email);
        company.setEmailVerified(true);
        company.setPersonalEmail(false);
        company.setWebsite("https://uber.com");
        company.setWebsiteDomainMatch(true);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(companyRepository.findByUser(user)).thenReturn(Optional.of(company));

        CompanyProfileResponse profile = companyService.getProfile(email);

        assertNotNull(profile);
        assertEquals(10L, profile.getId());
        assertEquals("Uber Technologies", profile.getCompanyName());
        assertTrue(profile.isEmailVerified());
        assertFalse(profile.isPersonalEmail());
        assertTrue(profile.isWebsiteDomainMatch());
        assertEquals("uber.com", profile.getEmailDomain());
        assertTrue(profile.getNotice().contains("Design Rule #4"));
    }

    @Test
    @DisplayName("updateProfile recalculates websiteDomainMatch when company website is updated")
    void updateProfile_recalculatesWebsiteMatch() {
        String email = "recruiter@stripe.com";
        User user = new User();
        user.setEmail(email);
        user.setName("Stripe Inc");

        Company company = new Company();
        company.setId(20L);
        company.setUser(user);
        company.setCompanyName("Stripe");
        company.setEmail(email);
        company.setEmailVerified(true);
        company.setPersonalEmail(false);
        company.setWebsiteDomainMatch(false); // initially false

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(companyRepository.findByUser(user)).thenReturn(Optional.of(company));
        when(companyRepository.save(any(Company.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CompanyProfileRequest request = new CompanyProfileRequest(
                "Stripe Global",
                "https://www.stripe.com",
                "United States",
                "Financial infrastructure for the internet."
        );

        CompanyProfileResponse updated = companyService.updateProfile(email, request);

        assertNotNull(updated);
        assertEquals("Stripe Global", updated.getCompanyName());
        assertEquals("https://www.stripe.com", updated.getWebsite());
        assertTrue(updated.isWebsiteDomainMatch(), "Expected websiteDomainMatch to be true for stripe.com matching stripe.com");
        assertFalse(updated.isPersonalEmail());
        verify(companyRepository).save(company);
    }

    @Test
    @DisplayName("updateProfile with personal email leaves personalEmail=true and websiteDomainMatch=false")
    void updateProfile_personalEmailRemainsFlagged() {
        String email = "smallbiz@gmail.com";
        User user = new User();
        user.setEmail(email);

        Company company = new Company();
        company.setId(30L);
        company.setUser(user);
        company.setCompanyName("Small Biz");
        company.setEmail(email);
        company.setEmailVerified(true);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(companyRepository.findByUser(user)).thenReturn(Optional.of(company));
        when(companyRepository.save(any(Company.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CompanyProfileRequest request = new CompanyProfileRequest(
                "Small Biz",
                "https://smallbiz.com",
                "Canada",
                "Local consultancy."
        );

        CompanyProfileResponse updated = companyService.updateProfile(email, request);

        assertNotNull(updated);
        assertTrue(updated.isPersonalEmail(), "Personal email must be detected and flagged");
        assertFalse(updated.isWebsiteDomainMatch(), "Personal email must not match website domain");
    }
}
