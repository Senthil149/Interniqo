package com.internship.platform.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internship.platform.dto.AuthResponse;
import com.internship.platform.dto.LoginRequest;
import com.internship.platform.dto.RegisterRequest;
import com.internship.platform.dto.RegisterResponse;
import com.internship.platform.dto.ResendCodeRequest;
import com.internship.platform.dto.ResendCodeResponse;
import com.internship.platform.dto.UserSummary;
import com.internship.platform.dto.VerifyCodeRequest;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Student;
import com.internship.platform.entity.User;
import com.internship.platform.entity.UserRole;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.StudentRepository;
import com.internship.platform.repository.UserRepository;
import com.internship.platform.security.JwtService;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailVerificationService emailVerificationService;

    public AuthService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            CompanyRepository companyRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            EmailVerificationService emailVerificationService) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.emailVerificationService = emailVerificationService;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        UserRole role = request.getRole();
        if (role == UserRole.ADMIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Admin accounts cannot be self-registered");
        }
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user = userRepository.save(user);

        if (role == UserRole.STUDENT) {
            Student student = new Student();
            student.setUser(user);
            studentRepository.save(student);

            // Generate 6-digit code, 10m expiry, and send verification email to student (or log to console)
            emailVerificationService.createAndSendVerification(user);
        } else if (role == UserRole.COMPANY) {
            Company company = new Company();
            company.setUser(user);
            String companyName = request.getCompanyName() == null || request.getCompanyName().isBlank()
                    ? user.getName()
                    : request.getCompanyName().trim();
            company.setCompanyName(companyName);
            company.setEmail(email);
            company.setEmailVerified(false);
            company = companyRepository.save(company);

            // Generate 6-digit code, 10m expiry, and send verification email (or log to console)
            emailVerificationService.createAndSendVerification(company);
        }

        return new RegisterResponse(
                user.getEmail(),
                user.getName(),
                user.getRole(),
                true,
                "Registration successful. Please enter the 6-digit verification code sent to your email to activate your account."
        );
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        // Mandatory blocking verification check
        if (user.getRole() == UserRole.COMPANY) {
            Company company = companyRepository.findByUser(user)
                    .or(() -> companyRepository.findByEmail(user.getEmail()))
                    .orElse(null);
            if (company != null && !company.isEmailVerified()) {
                throw new ApiException(HttpStatus.FORBIDDEN,
                        "Your company email has not been verified. Please enter your 6-digit verification code to activate your account.");
            }
        } else if (user.getRole() == UserRole.STUDENT) {
            if (!emailVerificationService.isUserEmailVerified(user)) {
                throw new ApiException(HttpStatus.FORBIDDEN,
                        "Your student email has not been verified. Please enter your 6-digit verification code to activate your account.");
            }
        }

        return tokensFor(user);
    }

    public AuthResponse verifyCode(VerifyCodeRequest request) {
        User user = emailVerificationService.verifyCode(request);
        return tokensFor(user);
    }

    public ResendCodeResponse resendCode(ResendCodeRequest request) {
        return emailVerificationService.resendVerificationCode(request);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.isValid(refreshToken) || !jwtService.isRefreshToken(refreshToken)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
        }
        String email = jwtService.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token"));
        return tokensFor(user);
    }

    public UserSummary me(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return buildUserSummary(user);
    }

    public com.internship.platform.dto.ForgotPasswordResponse forgotPassword(com.internship.platform.dto.ForgotPasswordRequest request) {
        return emailVerificationService.forgotPassword(request);
    }

    public com.internship.platform.dto.ResetPasswordResponse resetPassword(com.internship.platform.dto.ResetPasswordRequest request) {
        return emailVerificationService.resetPassword(request);
    }

    private AuthResponse tokensFor(User user) {
        return new AuthResponse(
                jwtService.createAccessToken(user),
                jwtService.createRefreshToken(user),
                buildUserSummary(user));
    }

    private UserSummary buildUserSummary(User user) {
        Boolean emailVerified = null;
        Long companyId = null;
        if (user.getRole() == UserRole.COMPANY) {
            Optional<Company> companyOpt = companyRepository.findByUser(user);
            if (companyOpt.isPresent()) {
                emailVerified = companyOpt.get().isEmailVerified();
                companyId = companyOpt.get().getId();
            }
        } else if (user.getRole() == UserRole.STUDENT) {
            emailVerified = emailVerificationService.isUserEmailVerified(user);
        }
        return UserSummary.from(user, emailVerified, companyId);
    }
}
