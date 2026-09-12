package com.internship.platform.service;

import com.internship.platform.dto.CompanyProfileRequest;
import com.internship.platform.dto.CompanyProfileResponse;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.User;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyService {

    private static final Logger log = LoggerFactory.getLogger(CompanyService.class);

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final DomainQualityService domainQualityService;

    public CompanyService(
            CompanyRepository companyRepository,
            UserRepository userRepository,
            DomainQualityService domainQualityService) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.domainQualityService = domainQualityService;
    }

    @Transactional(readOnly = true)
    public CompanyProfileResponse getProfile(String userEmail) {
        Company company = resolveCompany(userEmail);
        return toResponse(company);
    }

    @Transactional
    public CompanyProfileResponse updateProfile(String userEmail, CompanyProfileRequest request) {
        Company company = resolveCompany(userEmail);

        if (request.getCompanyName() != null && !request.getCompanyName().isBlank()) {
            company.setCompanyName(request.getCompanyName().trim());
        }
        if (request.getCountry() != null) {
            company.setCountry(request.getCountry().trim());
        }
        if (request.getDescription() != null) {
            company.setDescription(request.getDescription().trim());
        }

        if (request.getWebsite() != null) {
            String trimmedWebsite = request.getWebsite().trim();
            company.setWebsite(trimmedWebsite.isEmpty() ? null : trimmedWebsite);
        }

        // Recalculate domain signals based on verified company email and updated website
        boolean isPersonal = domainQualityService.isPersonalEmail(company.getEmail());
        boolean matchesWebsite = domainQualityService.matchesWebsiteDomain(company.getEmail(), company.getWebsite());

        company.setPersonalEmail(isPersonal);
        company.setWebsiteDomainMatch(matchesWebsite);

        Company saved = companyRepository.save(company);
        log.info("Updated company profile for ID {} (personalEmail={}, websiteMatch={})",
                saved.getId(), isPersonal, matchesWebsite);

        return toResponse(saved);
    }

    public Company resolveCompany(String email) {
        String normalized = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalized).orElse(null);
        if (user != null) {
            return companyRepository.findByUser(user)
                    .or(() -> companyRepository.findByEmail(normalized))
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No company profile found for user"));
        }
        return companyRepository.findByEmail(normalized)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Company not found for email: " + email));
    }

    public CompanyProfileResponse toResponse(Company company) {
        CompanyProfileResponse resp = new CompanyProfileResponse();
        resp.setId(company.getId());
        resp.setCompanyName(company.getCompanyName());
        resp.setEmail(company.getEmail());
        resp.setEmailVerified(company.isEmailVerified());
        resp.setPersonalEmail(company.isPersonalEmail());
        resp.setWebsiteDomainMatch(company.isWebsiteDomainMatch());
        resp.setEmailDomain(domainQualityService.extractDomainFromEmail(company.getEmail()));
        resp.setWebsite(company.getWebsite());
        resp.setCountry(company.getCountry());
        resp.setDescription(company.getDescription());
        return resp;
    }
}
