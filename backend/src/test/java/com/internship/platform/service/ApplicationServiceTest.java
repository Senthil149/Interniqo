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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private InternshipRepository internshipRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ApplicationService applicationService;

    private User studentUser;
    private Student student;
    private User companyUser;
    private Company company;
    private Internship internship;

    @BeforeEach
    void setUp() {
        studentUser = new User();
        studentUser.setId(1L);
        studentUser.setEmail("student@example.com");
        studentUser.setName("Alex Student");
        studentUser.setRole(UserRole.STUDENT);

        student = new Student();
        student.setId(10L);
        student.setUser(studentUser);
        student.setSkills("Java, React");
        student.setEducation("B.S. Computer Science");

        companyUser = new User();
        companyUser.setId(2L);
        companyUser.setEmail("careers@acme.com");
        companyUser.setName("Acme Recruiter");
        companyUser.setRole(UserRole.COMPANY);

        company = new Company();
        company.setId(20L);
        company.setUser(companyUser);
        company.setCompanyName("Acme Corp");
        company.setEmail("careers@acme.com");
        company.setEmailVerified(true);

        internship = new Internship();
        internship.setId(100L);
        internship.setTitle("Full Stack Engineer Intern");
        internship.setCompany(company);
        internship.setStatus("OPEN");
    }

    @Test
    @DisplayName("apply creates a new Application with status APPLIED")
    void applySuccess() {
        when(userRepository.findByEmail("student@example.com")).thenReturn(Optional.of(studentUser));
        when(studentRepository.findByUser(studentUser)).thenReturn(Optional.of(student));
        when(internshipRepository.findById(100L)).thenReturn(Optional.of(internship));
        when(applicationRepository.existsByStudentAndInternship(student, internship)).thenReturn(false);
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> {
            Application a = inv.getArgument(0);
            a.setId(500L);
            return a;
        });

        ApplicationResponse response = applicationService.apply("student@example.com", new ApplyRequest(100L));

        assertNotNull(response);
        assertEquals(500L, response.getId());
        assertEquals(ApplicationStatus.APPLIED, response.getStatus());
        assertEquals("Full Stack Engineer Intern", response.getInternshipTitle());
        assertEquals("Acme Corp", response.getCompanyName());
        assertEquals("Alex Student", response.getStudentName());
        verify(applicationRepository, times(1)).save(any(Application.class));
    }

    @Test
    @DisplayName("apply throws CONFLICT when student has already applied")
    void applyDuplicateThrowsConflict() {
        when(userRepository.findByEmail("student@example.com")).thenReturn(Optional.of(studentUser));
        when(studentRepository.findByUser(studentUser)).thenReturn(Optional.of(student));
        when(internshipRepository.findById(100L)).thenReturn(Optional.of(internship));
        when(applicationRepository.existsByStudentAndInternship(student, internship)).thenReturn(true);

        ApiException exception = assertThrows(ApiException.class, () ->
                applicationService.apply("student@example.com", new ApplyRequest(100L)));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertTrue(exception.getMessage().contains("already applied"));
        verify(applicationRepository, never()).save(any());
    }

    @Test
    @DisplayName("apply throws BAD_REQUEST when internship is not OPEN")
    void applyClosedInternshipThrowsBadRequest() {
        internship.setStatus("CLOSED");
        when(userRepository.findByEmail("student@example.com")).thenReturn(Optional.of(studentUser));
        when(studentRepository.findByUser(studentUser)).thenReturn(Optional.of(student));
        when(internshipRepository.findById(100L)).thenReturn(Optional.of(internship));

        ApiException exception = assertThrows(ApiException.class, () ->
                applicationService.apply("student@example.com", new ApplyRequest(100L)));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertTrue(exception.getMessage().contains("not accepting applications"));
        verify(applicationRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateStatus succeeds through valid transitions: APPLIED -> SHORTLISTED -> ACCEPTED -> COMPLETED")
    void updateStatusLifecycleTransitions() {
        Application application = new Application();
        application.setId(500L);
        application.setStudent(student);
        application.setInternship(internship);
        application.setStatus(ApplicationStatus.APPLIED);

        when(applicationRepository.findById(500L)).thenReturn(Optional.of(application));
        when(userRepository.findByEmail("careers@acme.com")).thenReturn(Optional.of(companyUser));
        when(companyRepository.findByUser(companyUser)).thenReturn(Optional.of(company));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1. APPLIED -> SHORTLISTED
        ApplicationResponse r1 = applicationService.updateStatus(500L, "careers@acme.com",
                new UpdateApplicationStatusRequest(ApplicationStatus.SHORTLISTED));
        assertEquals(ApplicationStatus.SHORTLISTED, r1.getStatus());

        // 2. SHORTLISTED -> ACCEPTED
        ApplicationResponse r2 = applicationService.updateStatus(500L, "careers@acme.com",
                new UpdateApplicationStatusRequest(ApplicationStatus.ACCEPTED));
        assertEquals(ApplicationStatus.ACCEPTED, r2.getStatus());

        // 3. ACCEPTED -> COMPLETED
        ApplicationResponse r3 = applicationService.updateStatus(500L, "careers@acme.com",
                new UpdateApplicationStatusRequest(ApplicationStatus.COMPLETED));
        assertEquals(ApplicationStatus.COMPLETED, r3.getStatus());
    }

    @Test
    @DisplayName("updateStatus throws FORBIDDEN when company does not own the internship")
    void updateStatusUnownedThrowsForbidden() {
        Company otherCompany = new Company();
        otherCompany.setId(99L);
        User otherUser = new User();
        otherUser.setId(9L);
        otherUser.setEmail("impostor@other.com");
        otherCompany.setUser(otherUser);

        Application application = new Application();
        application.setId(500L);
        application.setStudent(student);
        application.setInternship(internship); // owned by company ID 20, not 99
        application.setStatus(ApplicationStatus.APPLIED);

        when(applicationRepository.findById(500L)).thenReturn(Optional.of(application));
        when(userRepository.findByEmail("impostor@other.com")).thenReturn(Optional.of(otherUser));
        when(companyRepository.findByUser(otherUser)).thenReturn(Optional.of(otherCompany));

        ApiException exception = assertThrows(ApiException.class, () ->
                applicationService.updateStatus(500L, "impostor@other.com",
                        new UpdateApplicationStatusRequest(ApplicationStatus.SHORTLISTED)));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertTrue(exception.getMessage().contains("not authorized"));
    }

    @Test
    @DisplayName("validateStatusTransition throws BAD_REQUEST on invalid state jumps")
    void validateStatusTransitionInvalid() {
        // Direct jump from APPLIED to COMPLETED (not allowed)
        assertThrows(ApiException.class, () ->
                applicationService.validateStatusTransition(ApplicationStatus.APPLIED, ApplicationStatus.COMPLETED));

        // Moving backwards from REJECTED
        assertThrows(ApiException.class, () ->
                applicationService.validateStatusTransition(ApplicationStatus.REJECTED, ApplicationStatus.SHORTLISTED));

        // Moving backwards from COMPLETED
        assertThrows(ApiException.class, () ->
                applicationService.validateStatusTransition(ApplicationStatus.COMPLETED, ApplicationStatus.APPLIED));
    }
}
