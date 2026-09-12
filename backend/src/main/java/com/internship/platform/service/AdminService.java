package com.internship.platform.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internship.platform.dto.AdminBlockchainRecordResponse;
import com.internship.platform.dto.AdminCompanyResponse;
import com.internship.platform.dto.AdminEmailVerificationResponse;
import com.internship.platform.dto.AdminFlaggedInternshipResponse;
import com.internship.platform.dto.AdminMetricsResponse;
import com.internship.platform.dto.AdminUserResponse;
import com.internship.platform.entity.BlockchainRecord;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Credential;
import com.internship.platform.entity.EmailVerification;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.RiskAssessment;
import com.internship.platform.entity.RiskLevel;
import com.internship.platform.entity.Student;
import com.internship.platform.entity.User;
import com.internship.platform.entity.UserRole;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.ApplicationRepository;
import com.internship.platform.repository.BlockchainRecordRepository;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.CredentialRepository;
import com.internship.platform.repository.EmailVerificationRepository;
import com.internship.platform.repository.InternshipRepository;
import com.internship.platform.repository.RiskAssessmentRepository;
import com.internship.platform.repository.StudentRepository;
import com.internship.platform.repository.UserRepository;

@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final CompanyRepository companyRepository;
    private final InternshipRepository internshipRepository;
    private final ApplicationRepository applicationRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final BlockchainRecordRepository blockchainRecordRepository;
    private final CredentialRepository credentialRepository;

    public AdminService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            CompanyRepository companyRepository,
            InternshipRepository internshipRepository,
            ApplicationRepository applicationRepository,
            RiskAssessmentRepository riskAssessmentRepository,
            EmailVerificationRepository emailVerificationRepository,
            BlockchainRecordRepository blockchainRecordRepository,
            CredentialRepository credentialRepository) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.companyRepository = companyRepository;
        this.internshipRepository = internshipRepository;
        this.applicationRepository = applicationRepository;
        this.riskAssessmentRepository = riskAssessmentRepository;
        this.emailVerificationRepository = emailVerificationRepository;
        this.blockchainRecordRepository = blockchainRecordRepository;
        this.credentialRepository = credentialRepository;
    }

    /**
     * Get platform overview metrics.
     */
    @Transactional(readOnly = true)
    public AdminMetricsResponse getMetrics() {
        AdminMetricsResponse metrics = new AdminMetricsResponse();
        metrics.setTotalUsers(userRepository.count());
        metrics.setTotalStudents(userRepository.countByRole(UserRole.STUDENT));
        metrics.setTotalCompanies(userRepository.countByRole(UserRole.COMPANY));
        metrics.setTotalAdmins(userRepository.countByRole(UserRole.ADMIN));

        metrics.setTotalInternships(internshipRepository.count());
        metrics.setActiveInternships(internshipRepository.countByStatus("ACTIVE"));
        metrics.setClosedInternships(internshipRepository.countByStatus("CLOSED"));

        metrics.setTotalApplications(applicationRepository.count());

        metrics.setHighRiskPostings(riskAssessmentRepository.countByLevel(RiskLevel.HIGH));
        metrics.setMediumRiskPostings(riskAssessmentRepository.countByLevel(RiskLevel.MEDIUM));
        metrics.setLowRiskPostings(riskAssessmentRepository.countByLevel(RiskLevel.LOW));

        metrics.setTotalEmailVerifications(emailVerificationRepository.count());
        metrics.setVerifiedCompanies(companyRepository.countByEmailVerified(true));
        metrics.setTotalBlockchainCredentials(blockchainRecordRepository.count());

        return metrics;
    }

    /**
     * List users with optional role filtering.
     */
    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers(UserRole roleFilter) {
        List<User> users = (roleFilter != null)
                ? userRepository.findByRoleOrderByCreatedAtDesc(roleFilter)
                : userRepository.findAllByOrderByCreatedAtDesc();

        return users.stream().map(this::mapToUserResponse).toList();
    }

    /**
     * Update user role.
     * Prevents admins from removing their own admin privileges.
     */
    @Transactional
    public AdminUserResponse updateUserRole(Long userId, UserRole newRole, String currentAdminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getEmail().equalsIgnoreCase(currentAdminEmail) && newRole != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Administrators cannot remove their own admin role.");
        }

        user.setRole(newRole);
        user = userRepository.save(user);

        // Ensure corresponding role profile entity exists if transitioning
        if (newRole == UserRole.STUDENT && studentRepository.findByUser(user).isEmpty()) {
            Student student = new Student();
            student.setUser(user);
            studentRepository.save(student);
        } else if (newRole == UserRole.COMPANY && companyRepository.findByUser(user).isEmpty()) {
            Company company = new Company();
            company.setUser(user);
            company.setCompanyName(user.getName());
            company.setEmail(user.getEmail());
            company.setEmailVerified(false);
            companyRepository.save(company);
        }

        log.info("Admin {} changed role for user ID {} ({}) to {}",
                currentAdminEmail, user.getId(), user.getEmail(), newRole);

        return mapToUserResponse(user);
    }

    /**
     * List all companies with verification and posting stats.
     */
    @Transactional(readOnly = true)
    public List<AdminCompanyResponse> getCompanies() {
        return companyRepository.findAllByOrderByIdDesc().stream().map(comp -> {
            AdminCompanyResponse resp = new AdminCompanyResponse();
            resp.setId(comp.getId());
            resp.setCompanyName(comp.getCompanyName());
            resp.setEmail(comp.getEmail());
            resp.setEmailVerified(comp.isEmailVerified());
            resp.setWebsite(comp.getWebsite());
            resp.setCountry(comp.getCountry());
            resp.setDescription(comp.getDescription());
            if (comp.getUser() != null) {
                resp.setUserId(comp.getUser().getId());
                resp.setUserName(comp.getUser().getName());
            }
            resp.setInternshipCount(internshipRepository.findByCompanyOrderByIdDesc(comp).size());
            return resp;
        }).toList();
    }

    /**
     * Manually override company email verification status.
     */
    @Transactional
    public AdminCompanyResponse toggleCompanyVerification(Long companyId, boolean verified) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Company not found"));

        company.setEmailVerified(verified);
        company = companyRepository.save(company);

        log.info("Admin updated email verification for company ID {} ({}) to {}",
                company.getId(), company.getCompanyName(), verified);

        AdminCompanyResponse resp = new AdminCompanyResponse();
        resp.setId(company.getId());
        resp.setCompanyName(company.getCompanyName());
        resp.setEmail(company.getEmail());
        resp.setEmailVerified(company.isEmailVerified());
        resp.setWebsite(company.getWebsite());
        resp.setCountry(company.getCountry());
        resp.setDescription(company.getDescription());
        if (company.getUser() != null) {
            resp.setUserId(company.getUser().getId());
            resp.setUserName(company.getUser().getName());
        }
        resp.setInternshipCount(internshipRepository.findByCompanyOrderByIdDesc(company).size());
        return resp;
    }

    /**
     * List all internships with optional status filtering and risk signals.
     */
    @Transactional(readOnly = true)
    public List<AdminFlaggedInternshipResponse> getInternships(String statusFilter) {
        List<Internship> internships;
        if (statusFilter != null && !statusFilter.isBlank() && !"ALL".equalsIgnoreCase(statusFilter)) {
            internships = internshipRepository.findByStatusOrderByIdDesc(statusFilter.trim().toUpperCase());
        } else {
            internships = internshipRepository.findAllByOrderByIdDesc();
        }

        return internships.stream().map(this::mapToInternshipResponse).toList();
    }

    /**
     * Update internship listing status (e.g. ACTIVE, CLOSED, SUSPENDED).
     */
    @Transactional
    public AdminFlaggedInternshipResponse updateInternshipStatus(Long internshipId, String status) {
        Internship internship = internshipRepository.findById(internshipId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));

        internship.setStatus(status.trim().toUpperCase());
        internship = internshipRepository.save(internship);

        log.info("Admin updated status for internship ID {} to {}", internshipId, internship.getStatus());
        return mapToInternshipResponse(internship);
    }

    /**
     * Dedicated review queue for flagged postings (HIGH and MEDIUM risk level).
     */
    @Transactional(readOnly = true)
    public List<AdminFlaggedInternshipResponse> getFlaggedInternships() {
        List<RiskAssessment> flagged = riskAssessmentRepository.findByLevelInOrderByCreatedAtDesc(
                List.of(RiskLevel.HIGH, RiskLevel.MEDIUM));

        return flagged.stream().map(ra -> {
            Internship in = ra.getInternship();
            AdminFlaggedInternshipResponse resp = new AdminFlaggedInternshipResponse();
            resp.setInternshipId(in.getId());
            resp.setTitle(in.getTitle());
            resp.setCompanyId(in.getCompany().getId());
            resp.setCompanyName(in.getCompany().getCompanyName());
            resp.setCountry(in.getCountry());
            resp.setCity(in.getCity());
            resp.setWorkMode(in.getWorkMode());
            resp.setDuration(in.getDuration());
            resp.setStipend(in.getStipend());
            resp.setCurrency(in.getCurrency());
            resp.setStatus(in.getStatus());
            resp.setRiskScore(ra.getScore());
            resp.setRiskLevel(ra.getLevel());
            resp.setRiskReasons(parseReasons(ra.getReasons()));
            resp.setAssessedAt(ra.getCreatedAt());
            resp.setDeadline(in.getDeadline());
            return resp;
        }).toList();
    }

    /**
     * List email verification audit trail.
     */
    @Transactional(readOnly = true)
    public List<AdminEmailVerificationResponse> getEmailVerifications() {
        Instant now = Instant.now();
        return emailVerificationRepository.findAllByOrderByIdDesc().stream().map(ev -> {
            AdminEmailVerificationResponse resp = new AdminEmailVerificationResponse();
            resp.setId(ev.getId());
            resp.setToken(ev.getToken());
            resp.setExpiry(ev.getExpiry());
            resp.setVerifiedAt(ev.getVerifiedAt());
            resp.setVerified(ev.getVerifiedAt() != null);
            resp.setExpired(ev.getExpiry().isBefore(now) && ev.getVerifiedAt() == null);

            if (ev.getCompany() != null) {
                resp.setEmail(ev.getCompany().getEmail());
                resp.setTargetType("COMPANY");
                resp.setTargetName(ev.getCompany().getCompanyName());
            } else if (ev.getUser() != null) {
                resp.setEmail(ev.getUser().getEmail());
                resp.setTargetType("USER");
                resp.setTargetName(ev.getUser().getName());
            } else {
                resp.setEmail("N/A");
                resp.setTargetType("UNKNOWN");
                resp.setTargetName("N/A");
            }
            return resp;
        }).toList();
    }

    /**
     * List blockchain credential audit trail.
     */
    @Transactional(readOnly = true)
    public List<AdminBlockchainRecordResponse> getBlockchainRecords() {
        return blockchainRecordRepository.findAllByOrderByTimestampDesc().stream().map(br -> {
            AdminBlockchainRecordResponse resp = new AdminBlockchainRecordResponse();
            resp.setId(br.getId());
            resp.setTransactionHash(br.getTransactionHash());
            resp.setContractAddress(br.getContractAddress());
            resp.setNetwork(br.getNetwork());
            resp.setTimestamp(br.getTimestamp());

            Credential cred = br.getCredential();
            if (cred != null) {
                resp.setCredentialId(cred.getCredentialId());
                if (cred.getStudent() != null && cred.getStudent().getUser() != null) {
                    resp.setStudentName(cred.getStudent().getUser().getName());
                }
                if (cred.getCompany() != null) {
                    resp.setCompanyName(cred.getCompany().getCompanyName());
                }
                if (cred.getInternship() != null) {
                    resp.setInternshipTitle(cred.getInternship().getTitle());
                }
            }
            return resp;
        }).toList();
    }

    private AdminUserResponse mapToUserResponse(User user) {
        AdminUserResponse resp = new AdminUserResponse();
        resp.setId(user.getId());
        resp.setName(user.getName());
        resp.setEmail(user.getEmail());
        resp.setRole(user.getRole());
        resp.setCreatedAt(user.getCreatedAt());

        if (user.getRole() == UserRole.STUDENT) {
            studentRepository.findByUser(user).ifPresent(s -> resp.setStudentId(s.getId()));
            resp.setEmailVerified(emailVerificationRepository.isUserEmailVerified(user));
        } else if (user.getRole() == UserRole.COMPANY) {
            companyRepository.findByUser(user).ifPresent(c -> {
                resp.setCompanyId(c.getId());
                resp.setCompanyName(c.getCompanyName());
                resp.setEmailVerified(c.isEmailVerified());
            });
        }
        return resp;
    }

    private AdminFlaggedInternshipResponse mapToInternshipResponse(Internship internship) {
        AdminFlaggedInternshipResponse resp = new AdminFlaggedInternshipResponse();
        resp.setInternshipId(internship.getId());
        resp.setTitle(internship.getTitle());
        resp.setCompanyId(internship.getCompany().getId());
        resp.setCompanyName(internship.getCompany().getCompanyName());
        resp.setCountry(internship.getCountry());
        resp.setCity(internship.getCity());
        resp.setWorkMode(internship.getWorkMode());
        resp.setDuration(internship.getDuration());
        resp.setStipend(internship.getStipend());
        resp.setCurrency(internship.getCurrency());
        resp.setStatus(internship.getStatus());
        resp.setDeadline(internship.getDeadline());

        Optional<RiskAssessment> raOpt = riskAssessmentRepository.findTopByInternshipOrderByCreatedAtDesc(internship);
        if (raOpt.isPresent()) {
            RiskAssessment ra = raOpt.get();
            resp.setRiskScore(ra.getScore());
            resp.setRiskLevel(ra.getLevel());
            resp.setRiskReasons(parseReasons(ra.getReasons()));
            resp.setAssessedAt(ra.getCreatedAt());
        } else {
            resp.setRiskScore(0);
            resp.setRiskLevel(RiskLevel.LOW);
            resp.setRiskReasons(List.of());
        }
        return resp;
    }

    private List<String> parseReasons(String reasonsJson) {
        if (reasonsJson == null || reasonsJson.isBlank()) {
            return List.of();
        }
        // Simple JSON array parser for ["...", "..."]
        String cleaned = reasonsJson.trim();
        if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
            cleaned = cleaned.substring(1, cleaned.length() - 1).trim();
            if (cleaned.isEmpty()) {
                return List.of();
            }
            String[] parts = cleaned.split("\",\\s*\"");
            List<String> result = new ArrayList<>();
            for (String part : parts) {
                result.add(part.replace("\"", "").trim());
            }
            return result;
        }
        return List.of(reasonsJson);
    }
}
