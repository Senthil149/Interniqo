package com.internship.platform.service;

import com.internship.platform.dto.InternshipRequest;
import com.internship.platform.dto.InternshipResponse;
import com.internship.platform.dto.InternshipSearchParams;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.User;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.InternshipRepository;
import com.internship.platform.repository.UserRepository;
import com.internship.platform.util.InternshipSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InternshipService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final InternshipRepository internshipRepository;
    private final RiskAssessmentService riskAssessmentService;

    public InternshipService(
            UserRepository userRepository,
            CompanyRepository companyRepository,
            InternshipRepository internshipRepository,
            RiskAssessmentService riskAssessmentService) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.internshipRepository = internshipRepository;
        this.riskAssessmentService = riskAssessmentService;
    }

    // ── Company operations ──────────────────────────────────────────────────

    @Transactional
    public InternshipResponse create(String email, InternshipRequest request) {
        Company company = resolveCompany(email);
        Internship internship = new Internship();
        applyFields(internship, request, company);
        internship.setStatus("OPEN"); // always OPEN on creation; ignore request.status here
        Internship saved = internshipRepository.save(internship);

        // Automatically run risk assessment when company publishes an internship
        riskAssessmentService.analyzeInternship(saved.getId());
        com.internship.platform.entity.RiskAssessment risk =
                riskAssessmentService.getAssessmentEntity(saved).orElse(null);
        return InternshipResponse.from(saved, risk);
    }

    @Transactional(readOnly = true)
    public List<InternshipResponse> getMyListings(String email) {
        Company company = resolveCompany(email);
        return internshipRepository.findByCompanyOrderByIdDesc(company)
                .stream()
                .map(in -> {
                    com.internship.platform.entity.RiskAssessment risk =
                            riskAssessmentService.getAssessmentEntity(in).orElse(null);
                    return InternshipResponse.from(in, risk);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public InternshipResponse getByIdForCompany(Long id, String email) {
        Internship internship = findById(id);
        Company company = resolveCompany(email);
        assertOwnership(internship, company);
        com.internship.platform.entity.RiskAssessment risk =
                riskAssessmentService.getAssessmentEntity(internship).orElse(null);
        return InternshipResponse.from(internship, risk);
    }

    @Transactional
    public InternshipResponse update(Long id, String email, InternshipRequest request) {
        Internship internship = findById(id);
        Company company = resolveCompany(email);
        assertOwnership(internship, company);
        applyFields(internship, request, company);
        if (request.getStatus() != null) {
            internship.setStatus(request.getStatus());
        }
        Internship saved = internshipRepository.save(internship);

        // Re-trigger risk assessment on update
        riskAssessmentService.analyzeInternship(saved.getId());
        com.internship.platform.entity.RiskAssessment risk =
                riskAssessmentService.getAssessmentEntity(saved).orElse(null);
        return InternshipResponse.from(saved, risk);
    }

    @Transactional
    public void delete(Long id, String email) {
        Internship internship = findById(id);
        Company company = resolveCompany(email);
        assertOwnership(internship, company);
        internshipRepository.delete(internship);
    }

    // ── Public / Student operations ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public InternshipResponse getById(Long id) {
        Internship in = findById(id);
        com.internship.platform.entity.RiskAssessment risk =
                riskAssessmentService.getAssessmentEntity(in).orElse(null);
        return InternshipResponse.from(in, risk);
    }

    /**
     * Student cross-border search: mandatory structured filters applied server-side
     * via {@link InternshipSpecification}. No semantic ranking in this phase.
     */
    @Transactional(readOnly = true)
    public Page<InternshipResponse> search(InternshipSearchParams params, Pageable pageable) {
        return internshipRepository
                .findAll(InternshipSpecification.fromParams(params), pageable)
                .map(in -> {
                    com.internship.platform.entity.RiskAssessment risk =
                            riskAssessmentService.getAssessmentEntity(in).orElse(null);
                    return InternshipResponse.from(in, risk);
                });
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private Company resolveCompany(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        return companyRepository.findByUser(user)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN,
                        "No company profile associated with this account"));
    }

    private Internship findById(Long id) {
        return internshipRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));
    }

    private void assertOwnership(Internship internship, Company company) {
        if (!internship.getCompany().getId().equals(company.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "You do not have permission to modify this internship");
        }
    }

    private void applyFields(Internship internship, InternshipRequest request, Company company) {
        internship.setCompany(company);
        internship.setTitle(request.getTitle().trim());
        internship.setDescription(request.getDescription());
        internship.setRequiredSkills(request.getRequiredSkills());
        internship.setCountry(request.getCountry().trim());
        internship.setCity(request.getCity() != null ? request.getCity().trim() : null);
        internship.setWorkMode(request.getWorkMode().trim().toUpperCase());
        internship.setDuration(request.getDuration());
        internship.setStipend(request.getStipend());
        internship.setCurrency(request.getCurrency() != null
                ? request.getCurrency().trim().toUpperCase() : null);
        internship.setEligibility(request.getEligibility());
        internship.setVisaInformation(request.getVisaInformation());
        internship.setDeadline(request.getDeadline());
    }
}
