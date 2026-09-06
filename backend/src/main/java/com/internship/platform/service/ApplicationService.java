package com.internship.platform.service;

import com.internship.platform.dto.ApplicationResponse;
import com.internship.platform.dto.ApplyRequest;
import com.internship.platform.dto.UpdateApplicationStatusRequest;
import com.internship.platform.entity.Application;
import com.internship.platform.entity.ApplicationStatus;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.Student;
import com.internship.platform.entity.User;
import com.internship.platform.entity.UserRole;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.ApplicationRepository;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.InternshipRepository;
import com.internship.platform.repository.StudentRepository;
import com.internship.platform.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ApplicationService.class);

    private final ApplicationRepository applicationRepository;
    private final InternshipRepository internshipRepository;
    private final StudentRepository studentRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public ApplicationService(
            ApplicationRepository applicationRepository,
            InternshipRepository internshipRepository,
            StudentRepository studentRepository,
            CompanyRepository companyRepository,
            UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.internshipRepository = internshipRepository;
        this.studentRepository = studentRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    /**
     * Student applies to an open internship.
     * Enforces single application per student/internship pair.
     */
    @Transactional
    public ApplicationResponse apply(String studentEmail, ApplyRequest request) {
        Student student = resolveStudent(studentEmail);

        Internship internship = internshipRepository.findById(request.getInternshipId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found with ID: " + request.getInternshipId()));

        if (!"OPEN".equalsIgnoreCase(internship.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This internship is not accepting applications (status: " + internship.getStatus() + ")");
        }

        if (applicationRepository.existsByStudentAndInternship(student, internship)) {
            throw new ApiException(HttpStatus.CONFLICT, "You have already applied to this internship");
        }

        Application application = new Application();
        application.setStudent(student);
        application.setInternship(internship);
        application.setStatus(ApplicationStatus.APPLIED);

        Application saved = applicationRepository.save(application);
        log.info("Student {} ({}) applied to internship {} ({})",
                student.getId(), studentEmail, internship.getId(), internship.getTitle());

        return ApplicationResponse.from(saved);
    }

    /**
     * Return all applications submitted by the given student.
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getMyApplications(String studentEmail) {
        Student student = resolveStudent(studentEmail);
        return applicationRepository.findByStudentOrderByAppliedAtDesc(student)
                .stream()
                .map(ApplicationResponse::from)
                .toList();
    }

    /**
     * Check if a student has already applied to a specific internship.
     */
    @Transactional(readOnly = true)
    public Optional<ApplicationResponse> checkApplication(String studentEmail, Long internshipId) {
        Student student = resolveStudent(studentEmail);
        Internship internship = internshipRepository.findById(internshipId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));

        return applicationRepository.findByStudentAndInternship(student, internship)
                .map(ApplicationResponse::from);
    }

    /**
     * Return applications received by the company, optionally filtered by internship ID.
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getCompanyApplications(String companyEmail, Long internshipId) {
        Company company = resolveCompany(companyEmail);

        if (internshipId != null) {
            Internship internship = internshipRepository.findById(internshipId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));

            if (!internship.getCompany().getId().equals(company.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to view applications for this internship");
            }
            return applicationRepository.findByInternshipCompanyAndInternshipOrderByAppliedAtDesc(company, internship)
                    .stream()
                    .map(ApplicationResponse::from)
                    .toList();
        }

        return applicationRepository.findByInternshipCompanyOrderByAppliedAtDesc(company)
                .stream()
                .map(ApplicationResponse::from)
                .toList();
    }

    /**
     * Role-aware retrieval for GET /api/applications.
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicationsForCurrentUser(String email, Long internshipId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (user.getRole() == UserRole.STUDENT) {
            return getMyApplications(email);
        } else if (user.getRole() == UserRole.COMPANY) {
            return getCompanyApplications(email, internshipId);
        } else if (user.getRole() == UserRole.ADMIN) {
            if (internshipId != null) {
                Internship internship = internshipRepository.findById(internshipId)
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));
                return applicationRepository.findByInternshipOrderByAppliedAtDesc(internship)
                        .stream()
                        .map(ApplicationResponse::from)
                        .toList();
            }
            return applicationRepository.findAll().stream().map(ApplicationResponse::from).toList();
        } else {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }

    /**
     * Company advances application status through valid lifecycle transitions:
     * APPLIED -> SHORTLISTED -> ACCEPTED/REJECTED -> COMPLETED.
     */
    @Transactional
    public ApplicationResponse updateStatus(Long applicationId, String userEmail, UpdateApplicationStatusRequest request) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found with ID: " + applicationId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));

        // Verify company owns this internship (admin exempt)
        if (user.getRole() != UserRole.ADMIN) {
            Company company = resolveCompany(userEmail);
            if (application.getInternship() == null ||
                    application.getInternship().getCompany() == null ||
                    !application.getInternship().getCompany().getId().equals(company.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to update applications for this internship");
            }
        }

        ApplicationStatus currentStatus = application.getStatus();
        ApplicationStatus targetStatus = request.getStatus();

        if (currentStatus == targetStatus) {
            return ApplicationResponse.from(application);
        }

        validateStatusTransition(currentStatus, targetStatus);

        application.setStatus(targetStatus);
        Application updated = applicationRepository.save(application);
        log.info("Application ID {} status transitioned: {} -> {} by {}",
                applicationId, currentStatus, targetStatus, userEmail);

        return ApplicationResponse.from(updated);
    }

    /**
     * Enforce status transition lifecycle state machine:
     * - APPLIED -> SHORTLISTED, REJECTED, ACCEPTED
     * - SHORTLISTED -> ACCEPTED, REJECTED
     * - ACCEPTED -> COMPLETED
     * - REJECTED -> Terminal (no further transitions)
     * - COMPLETED -> Terminal (no further transitions)
     */
    public void validateStatusTransition(ApplicationStatus current, ApplicationStatus target) {
        boolean valid = false;

        switch (current) {
            case APPLIED:
                valid = (target == ApplicationStatus.SHORTLISTED ||
                        target == ApplicationStatus.REJECTED ||
                        target == ApplicationStatus.ACCEPTED);
                break;
            case SHORTLISTED:
                valid = (target == ApplicationStatus.ACCEPTED ||
                        target == ApplicationStatus.REJECTED);
                break;
            case ACCEPTED:
                valid = (target == ApplicationStatus.COMPLETED);
                break;
            case REJECTED:
            case COMPLETED:
                valid = false;
                break;
        }

        if (!valid) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    String.format("Invalid status transition from %s to %s", current, target));
        }
    }

    private Student resolveStudent(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        return studentRepository.findByUser(user)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "No student profile associated with this account"));
    }

    private Company resolveCompany(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        return companyRepository.findByUser(user)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "No company profile associated with this account"));
    }
}
