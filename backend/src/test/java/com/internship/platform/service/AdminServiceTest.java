package com.internship.platform.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.internship.platform.dto.AdminCompanyResponse;
import com.internship.platform.dto.AdminFlaggedInternshipResponse;
import com.internship.platform.dto.AdminMetricsResponse;
import com.internship.platform.dto.AdminUserResponse;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.RiskAssessment;
import com.internship.platform.entity.RiskLevel;
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

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private InternshipRepository internshipRepository;
    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private RiskAssessmentRepository riskAssessmentRepository;
    @Mock
    private EmailVerificationRepository emailVerificationRepository;
    @Mock
    private BlockchainRecordRepository blockchainRecordRepository;
    @Mock
    private CredentialRepository credentialRepository;

    private AdminService adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminService(
                userRepository,
                studentRepository,
                companyRepository,
                internshipRepository,
                applicationRepository,
                riskAssessmentRepository,
                emailVerificationRepository,
                blockchainRecordRepository,
                credentialRepository
        );
    }

    @Test
    void testGetMetrics() {
        when(userRepository.count()).thenReturn(100L);
        when(userRepository.countByRole(UserRole.STUDENT)).thenReturn(70L);
        when(userRepository.countByRole(UserRole.COMPANY)).thenReturn(28L);
        when(userRepository.countByRole(UserRole.ADMIN)).thenReturn(2L);
        when(internshipRepository.count()).thenReturn(50L);
        when(internshipRepository.countByStatus("ACTIVE")).thenReturn(45L);
        when(internshipRepository.countByStatus("CLOSED")).thenReturn(5L);
        when(applicationRepository.count()).thenReturn(120L);
        when(riskAssessmentRepository.countByLevel(RiskLevel.HIGH)).thenReturn(3L);
        when(riskAssessmentRepository.countByLevel(RiskLevel.MEDIUM)).thenReturn(7L);
        when(riskAssessmentRepository.countByLevel(RiskLevel.LOW)).thenReturn(40L);
        when(emailVerificationRepository.count()).thenReturn(35L);
        when(companyRepository.countByEmailVerified(true)).thenReturn(20L);
        when(blockchainRecordRepository.count()).thenReturn(15L);

        AdminMetricsResponse metrics = adminService.getMetrics();

        assertNotNull(metrics);
        assertEquals(100L, metrics.getTotalUsers());
        assertEquals(70L, metrics.getTotalStudents());
        assertEquals(28L, metrics.getTotalCompanies());
        assertEquals(2L, metrics.getTotalAdmins());
        assertEquals(50L, metrics.getTotalInternships());
        assertEquals(45L, metrics.getActiveInternships());
        assertEquals(3L, metrics.getHighRiskPostings());
        assertEquals(7L, metrics.getMediumRiskPostings());
        assertEquals(15L, metrics.getTotalBlockchainCredentials());
    }

    @Test
    void testGetUsersWithAndWithoutFilter() {
        User u1 = new User();
        u1.setId(1L);
        u1.setName("Alice");
        u1.setEmail("alice@test.com");
        u1.setRole(UserRole.STUDENT);

        User u2 = new User();
        u2.setId(2L);
        u2.setName("Bob");
        u2.setEmail("bob@test.com");
        u2.setRole(UserRole.COMPANY);

        when(userRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(u1, u2));
        when(userRepository.findByRoleOrderByCreatedAtDesc(UserRole.STUDENT)).thenReturn(List.of(u1));

        List<AdminUserResponse> allUsers = adminService.getUsers(null);
        assertEquals(2, allUsers.size());

        List<AdminUserResponse> studentUsers = adminService.getUsers(UserRole.STUDENT);
        assertEquals(1, studentUsers.size());
        assertEquals("Alice", studentUsers.get(0).getName());
    }

    @Test
    void testUpdateUserRoleSuccess() {
        User user = new User();
        user.setId(5L);
        user.setEmail("user@example.com");
        user.setRole(UserRole.STUDENT);

        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        AdminUserResponse response = adminService.updateUserRole(5L, UserRole.ADMIN, "admin@interniqo.com");

        assertNotNull(response);
        assertEquals(UserRole.ADMIN, response.getRole());
        verify(userRepository).save(user);
    }

    @Test
    void testPreventAdminSelfDemotion() {
        User adminUser = new User();
        adminUser.setId(1L);
        adminUser.setEmail("admin@interniqo.com");
        adminUser.setRole(UserRole.ADMIN);

        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

        ApiException ex = assertThrows(ApiException.class, () ->
                adminService.updateUserRole(1L, UserRole.STUDENT, "admin@interniqo.com")
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("cannot remove their own admin role"));
    }

    @Test
    void testToggleCompanyVerification() {
        Company company = new Company();
        company.setId(10L);
        company.setCompanyName("Acme Corp");
        company.setEmail("careers@acme.com");
        company.setEmailVerified(false);

        when(companyRepository.findById(10L)).thenReturn(Optional.of(company));
        when(companyRepository.save(any(Company.class))).thenAnswer(i -> i.getArgument(0));

        AdminCompanyResponse resp = adminService.toggleCompanyVerification(10L, true);

        assertTrue(resp.isEmailVerified());
        assertTrue(company.isEmailVerified());
        verify(companyRepository).save(company);
    }

    @Test
    void testUpdateInternshipStatus() {
        Internship internship = new Internship();
        internship.setId(25L);
        internship.setTitle("Junior Dev");
        internship.setStatus("ACTIVE");

        Company company = new Company();
        company.setId(10L);
        company.setCompanyName("Acme Corp");
        internship.setCompany(company);

        when(internshipRepository.findById(25L)).thenReturn(Optional.of(internship));
        when(internshipRepository.save(any(Internship.class))).thenAnswer(i -> i.getArgument(0));
        when(riskAssessmentRepository.findTopByInternshipOrderByCreatedAtDesc(internship)).thenReturn(Optional.empty());

        AdminFlaggedInternshipResponse resp = adminService.updateInternshipStatus(25L, "CLOSED");

        assertEquals("CLOSED", resp.getStatus());
        assertEquals("CLOSED", internship.getStatus());
    }

    @Test
    void testGetFlaggedInternships() {
        Company company = new Company();
        company.setId(10L);
        company.setCompanyName("Sketchy Inc");

        Internship internship = new Internship();
        internship.setId(99L);
        internship.setTitle("High Paying Data Entry");
        internship.setCompany(company);
        internship.setStatus("ACTIVE");

        RiskAssessment ra = new RiskAssessment();
        ra.setId(1L);
        ra.setInternship(internship);
        ra.setScore(85);
        ra.setLevel(RiskLevel.HIGH);
        ra.setReasons("[\"Registration fee requested\", \"Unrealistic stipend\"]");
        ra.setCreatedAt(Instant.now());

        when(riskAssessmentRepository.findByLevelInOrderByCreatedAtDesc(List.of(RiskLevel.HIGH, RiskLevel.MEDIUM)))
                .thenReturn(List.of(ra));

        List<AdminFlaggedInternshipResponse> flagged = adminService.getFlaggedInternships();

        assertEquals(1, flagged.size());
        AdminFlaggedInternshipResponse item = flagged.get(0);
        assertEquals(85, item.getRiskScore());
        assertEquals(RiskLevel.HIGH, item.getRiskLevel());
        assertEquals(2, item.getRiskReasons().size());
        assertEquals("Registration fee requested", item.getRiskReasons().get(0));
    }
}
