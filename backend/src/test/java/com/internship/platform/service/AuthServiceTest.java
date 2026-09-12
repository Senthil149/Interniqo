package com.internship.platform.service;

import com.internship.platform.dto.AuthResponse;
import com.internship.platform.dto.LoginRequest;
import com.internship.platform.dto.RegisterRequest;
import com.internship.platform.dto.UserSummary;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Student;
import com.internship.platform.entity.User;
import com.internship.platform.entity.UserRole;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.StudentRepository;
import com.internship.platform.repository.UserRepository;
import com.internship.platform.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private EmailVerificationService emailVerificationService;

    @InjectMocks
    private AuthService authService;

    private User studentUser;
    private User companyUser;

    @BeforeEach
    void setUp() {
        studentUser = new User();
        studentUser.setId(1L);
        studentUser.setName("Alice Student");
        studentUser.setEmail("alice@example.com");
        studentUser.setRole(UserRole.STUDENT);

        companyUser = new User();
        companyUser.setId(2L);
        companyUser.setName("Acme Hiring");
        companyUser.setEmail("careers@acme.com");
        companyUser.setRole(UserRole.COMPANY);
    }

    @Test
    @DisplayName("register: Student registration creates User, Student entity, and returns JWT tokens")
    void registerStudent_success() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Alice Student");
        request.setEmail("alice@example.com");
        request.setPassword("Secret123!");
        request.setRole(UserRole.STUDENT);

        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Secret123!")).thenReturn("hashed_secret");
        when(userRepository.save(any(User.class))).thenReturn(studentUser);
        when(jwtService.createAccessToken(any(User.class))).thenReturn("access_token_123");
        when(jwtService.createRefreshToken(any(User.class))).thenReturn("refresh_token_123");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("access_token_123", response.getAccessToken());
        assertEquals("refresh_token_123", response.getRefreshToken());
        assertEquals(UserRole.STUDENT, response.getUser().getRole());
        assertEquals("alice@example.com", response.getUser().getEmail());

        verify(studentRepository, times(1)).save(any(Student.class));
        verify(companyRepository, never()).save(any(Company.class));
        verify(emailVerificationService, never()).createAndSendVerification(any(Company.class));
    }

    @Test
    @DisplayName("register: Company registration creates User, Company entity, triggers email verification token, and returns tokens")
    void registerCompany_success() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Acme Hiring");
        request.setEmail("careers@acme.com");
        request.setPassword("Secret123!");
        request.setRole(UserRole.COMPANY);
        request.setCompanyName("Acme Corp");

        Company company = new Company();
        company.setId(10L);
        company.setCompanyName("Acme Corp");
        company.setEmail("careers@acme.com");
        company.setEmailVerified(false);
        company.setUser(companyUser);

        when(userRepository.existsByEmail("careers@acme.com")).thenReturn(false);
        when(passwordEncoder.encode("Secret123!")).thenReturn("hashed_secret");
        when(userRepository.save(any(User.class))).thenReturn(companyUser);
        when(companyRepository.save(any(Company.class))).thenReturn(company);
        when(companyRepository.findByUser(companyUser)).thenReturn(Optional.of(company));
        when(jwtService.createAccessToken(any(User.class))).thenReturn("access_token_456");
        when(jwtService.createRefreshToken(any(User.class))).thenReturn("refresh_token_456");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("access_token_456", response.getAccessToken());
        assertEquals("refresh_token_456", response.getRefreshToken());
        assertEquals(UserRole.COMPANY, response.getUser().getRole());
        assertFalse(Boolean.TRUE.equals(response.getUser().getEmailVerified()));
        assertEquals(10L, response.getUser().getCompanyId());

        verify(companyRepository, times(1)).save(any(Company.class));
        verify(emailVerificationService, times(1)).createAndSendVerification(any(Company.class));
        verify(studentRepository, never()).save(any(Student.class));
    }

    @Test
    @DisplayName("register: Self-registering as ADMIN throws BAD_REQUEST")
    void register_adminRole_throwsBadRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Hacker");
        request.setEmail("admin@hack.com");
        request.setPassword("Secret123!");
        request.setRole(UserRole.ADMIN);

        ApiException ex = assertThrows(ApiException.class, () -> authService.register(request));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Admin accounts cannot be self-registered"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("register: Duplicate email throws CONFLICT")
    void register_duplicateEmail_throwsConflict() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Alice Copy");
        request.setEmail("alice@example.com");
        request.setPassword("Secret123!");
        request.setRole(UserRole.STUDENT);

        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () -> authService.register(request));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertTrue(ex.getMessage().contains("already exists"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("login: Valid credentials authenticate and return tokens")
    void login_success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("Secret123!");

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(studentUser));
        when(jwtService.createAccessToken(studentUser)).thenReturn("access_token_login");
        when(jwtService.createRefreshToken(studentUser)).thenReturn("refresh_token_login");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("access_token_login", response.getAccessToken());
        assertEquals("refresh_token_login", response.getRefreshToken());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("login: Invalid credentials propagate BadCredentialsException")
    void login_badCredentials_throws() {
        LoginRequest request = new LoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("WrongPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("refresh: Valid refresh token issues new tokens")
    void refresh_validToken_success() {
        when(jwtService.isValid("valid_refresh")).thenReturn(true);
        when(jwtService.isRefreshToken("valid_refresh")).thenReturn(true);
        when(jwtService.extractEmail("valid_refresh")).thenReturn("alice@example.com");
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(studentUser));
        when(jwtService.createAccessToken(studentUser)).thenReturn("new_access");
        when(jwtService.createRefreshToken(studentUser)).thenReturn("new_refresh");

        AuthResponse response = authService.refresh("valid_refresh");

        assertNotNull(response);
        assertEquals("new_access", response.getAccessToken());
        assertEquals("new_refresh", response.getRefreshToken());
    }

    @Test
    @DisplayName("refresh: Invalid or non-refresh token throws UNAUTHORIZED")
    void refresh_invalidToken_throwsUnauthorized() {
        when(jwtService.isValid("invalid_token")).thenReturn(false);

        ApiException ex = assertThrows(ApiException.class, () -> authService.refresh("invalid_token"));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
    }

    @Test
    @DisplayName("me: Returns UserSummary with company email verification status")
    void me_companyUser_returnsSummary() {
        Company company = new Company();
        company.setId(25L);
        company.setEmailVerified(true);

        when(userRepository.findByEmail("careers@acme.com")).thenReturn(Optional.of(companyUser));
        when(companyRepository.findByUser(companyUser)).thenReturn(Optional.of(company));

        UserSummary summary = authService.me("careers@acme.com");

        assertNotNull(summary);
        assertEquals(UserRole.COMPANY, summary.getRole());
        assertTrue(Boolean.TRUE.equals(summary.getEmailVerified()));
        assertEquals(25L, summary.getCompanyId());
    }
}
