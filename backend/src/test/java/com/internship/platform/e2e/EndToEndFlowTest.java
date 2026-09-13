package com.internship.platform.e2e;

import com.internship.platform.client.AiServiceClient;
import com.internship.platform.dto.*;
import com.internship.platform.dto.PublicVerifyResponse.VerificationStatus;
import com.internship.platform.entity.*;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.*;
import com.internship.platform.security.JwtService;
import com.internship.platform.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Complete End-to-End Integration Flow Test covering the entire project lifecycle:
 *
 * 1. Registration (Student & Company)
 * 2. Resume Upload & SBERT AI Profile Extraction
 * 3. Internship Posting, Heuristic Risk Assessment & AI Recommendation Ranking
 * 4. Application Submission
 * 5. Company Domain Email Verification (Design Rule #4)
 * 6. Application Review & Completion Lifecycle Transition
 * 7. Blockchain Credential Issuance & SHA-256 Anchoring (Design Rule #5)
 * 8. Public Credential Verification & Ledger Cryptographic Audit
 */
class EndToEndFlowTest {

    // Repositories (stateful in-memory mocks)
    private UserRepository userRepository;
    private StudentRepository studentRepository;
    private CompanyRepository companyRepository;
    private InternshipRepository internshipRepository;
    private RiskAssessmentRepository riskAssessmentRepository;
    private RecommendationRepository recommendationRepository;
    private ApplicationRepository applicationRepository;
    private EmailVerificationRepository emailVerificationRepository;
    private CredentialRepository credentialRepository;
    private BlockchainRecordRepository blockchainRecordRepository;

    // External Service Clients & Helpers
    private PasswordEncoder passwordEncoder;
    private AuthenticationManager authenticationManager;
    private JwtService jwtService;
    private AiServiceClient aiServiceClient;
    private BlockchainService blockchainService;
    private EmailService emailService;

    // Services Under Test
    private AuthService authService;
    private StudentService studentService;
    private InternshipService internshipService;
    private RiskAssessmentService riskAssessmentService;
    private RecommendationService recommendationService;
    private ApplicationService applicationService;
    private EmailVerificationService emailVerificationService;
    private CredentialService credentialService;

    // In-memory data store for E2E persistence
    private final Map<Long, User> userStore = new HashMap<>();
    private final Map<String, User> userEmailStore = new HashMap<>();
    private final Map<Long, Student> studentStore = new HashMap<>();
    private final Map<Long, Company> companyStore = new HashMap<>();
    private final Map<Long, Internship> internshipStore = new HashMap<>();
    private final Map<Long, RiskAssessment> riskStore = new HashMap<>();
    private final Map<Long, Application> applicationStore = new HashMap<>();
    private final Map<String, EmailVerification> tokenStore = new HashMap<>();
    private final Map<String, Credential> credentialStore = new HashMap<>();
    private final Map<String, BlockchainRecord> blockchainRecordStore = new HashMap<>();
    private final List<Recommendation> recommendationStore = new ArrayList<>();

    private final AtomicLong idGen = new AtomicLong(100);

    @TempDir
    Path tempUploadDir;

    @BeforeEach
    void setUp() {
        // Clear stores
        userStore.clear();
        userEmailStore.clear();
        studentStore.clear();
        companyStore.clear();
        internshipStore.clear();
        riskStore.clear();
        applicationStore.clear();
        tokenStore.clear();
        credentialStore.clear();
        blockchainRecordStore.clear();
        recommendationStore.clear();

        // 1. Mock Repositories with stateful behavior
        userRepository = mock(UserRepository.class);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            if (u.getId() == null) u.setId(idGen.incrementAndGet());
            userStore.put(u.getId(), u);
            userEmailStore.put(u.getEmail(), u);
            return u;
        });
        when(userRepository.findByEmail(anyString())).thenAnswer(inv ->
                Optional.ofNullable(userEmailStore.get(inv.getArgument(0))));
        when(userRepository.existsByEmail(anyString())).thenAnswer(inv ->
                userEmailStore.containsKey(inv.getArgument(0)));

        studentRepository = mock(StudentRepository.class);
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> {
            Student s = inv.getArgument(0);
            if (s.getId() == null) s.setId(idGen.incrementAndGet());
            studentStore.put(s.getId(), s);
            return s;
        });
        when(studentRepository.findByUser(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            return studentStore.values().stream()
                    .filter(s -> s.getUser() != null && s.getUser().getId().equals(u.getId()))
                    .findFirst();
        });

        companyRepository = mock(CompanyRepository.class);
        when(companyRepository.save(any(Company.class))).thenAnswer(inv -> {
            Company c = inv.getArgument(0);
            if (c.getId() == null) c.setId(idGen.incrementAndGet());
            companyStore.put(c.getId(), c);
            return c;
        });
        when(companyRepository.findByUser(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            return companyStore.values().stream()
                    .filter(c -> c.getUser() != null && c.getUser().getId().equals(u.getId()))
                    .findFirst();
        });
        when(companyRepository.findById(anyLong())).thenAnswer(inv ->
                Optional.ofNullable(companyStore.get(inv.getArgument(0))));

        internshipRepository = mock(InternshipRepository.class);
        when(internshipRepository.save(any(Internship.class))).thenAnswer(inv -> {
            Internship in = inv.getArgument(0);
            if (in.getId() == null) in.setId(idGen.incrementAndGet());
            internshipStore.put(in.getId(), in);
            return in;
        });
        when(internshipRepository.findById(anyLong())).thenAnswer(inv ->
                Optional.ofNullable(internshipStore.get(inv.getArgument(0))));
        when(internshipRepository.findAll(any(Specification.class))).thenAnswer(inv ->
                new ArrayList<>(internshipStore.values()));
        when(internshipRepository.findByCompanyOrderByIdDesc(any(Company.class))).thenAnswer(inv -> {
            Company c = inv.getArgument(0);
            return internshipStore.values().stream()
                    .filter(in -> in.getCompany() != null && in.getCompany().getId().equals(c.getId()))
                    .toList();
        });

        riskAssessmentRepository = mock(RiskAssessmentRepository.class);
        when(riskAssessmentRepository.save(any(RiskAssessment.class))).thenAnswer(inv -> {
            RiskAssessment ra = inv.getArgument(0);
            if (ra.getId() == null) ra.setId(idGen.incrementAndGet());
            riskStore.put(ra.getId(), ra);
            return ra;
        });
        when(riskAssessmentRepository.findTopByInternshipOrderByCreatedAtDesc(any(Internship.class))).thenAnswer(inv -> {
            Internship in = inv.getArgument(0);
            return riskStore.values().stream()
                    .filter(ra -> ra.getInternship() != null && ra.getInternship().getId().equals(in.getId()))
                    .findFirst();
        });

        recommendationRepository = mock(RecommendationRepository.class);
        when(recommendationRepository.saveAll(anyIterable())).thenAnswer(inv -> {
            Iterable<Recommendation> recs = inv.getArgument(0);
            recs.forEach(recommendationStore::add);
            return recommendationStore;
        });
        when(recommendationRepository.findByStudentOrderByRankingAsc(any(Student.class))).thenAnswer(inv ->
                new ArrayList<>(recommendationStore));
        doAnswer(inv -> {
            recommendationStore.clear();
            return null;
        }).when(recommendationRepository).deleteByStudent(any(Student.class));

        applicationRepository = mock(ApplicationRepository.class);
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> {
            Application a = inv.getArgument(0);
            if (a.getId() == null) {
                a.setId(idGen.incrementAndGet());
                a.setAppliedAt(Instant.now());
            }
            a.setUpdatedAt(Instant.now());
            applicationStore.put(a.getId(), a);
            return a;
        });
        when(applicationRepository.findById(anyLong())).thenAnswer(inv ->
                Optional.ofNullable(applicationStore.get(inv.getArgument(0))));
        when(applicationRepository.existsByStudentAndInternship(any(Student.class), any(Internship.class)))
                .thenAnswer(inv -> {
                    Student s = inv.getArgument(0);
                    Internship in = inv.getArgument(1);
                    return applicationStore.values().stream()
                            .anyMatch(a -> a.getStudent().getId().equals(s.getId()) &&
                                    a.getInternship().getId().equals(in.getId()));
                });

        emailVerificationRepository = mock(EmailVerificationRepository.class);
        when(emailVerificationRepository.save(any(EmailVerification.class))).thenAnswer(inv -> {
            EmailVerification ev = inv.getArgument(0);
            if (ev.getId() == null) ev.setId(idGen.incrementAndGet());
            tokenStore.put(ev.getToken(), ev);
            return ev;
        });
        when(emailVerificationRepository.findByToken(anyString())).thenAnswer(inv ->
                Optional.ofNullable(tokenStore.get(inv.getArgument(0))));
        when(emailVerificationRepository.isUserEmailVerified(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            return tokenStore.values().stream().anyMatch(ev -> ev.getUser() != null &&
                    ev.getUser().getId().equals(u.getId()) &&
                    ev.getVerifiedAt() != null &&
                    !ev.getToken().startsWith("reset_"));
        });
        when(emailVerificationRepository.findTopByUserAndTokenAndVerifiedAtIsNull(any(User.class), anyString()))
                .thenAnswer(inv -> {
                    User u = inv.getArgument(0);
                    String t = inv.getArgument(1);
                    return tokenStore.values().stream()
                            .filter(ev -> ev.getUser() != null && ev.getUser().getId().equals(u.getId())
                                    && ev.getToken().equals(t) && ev.getVerifiedAt() == null)
                            .findFirst();
                });
        when(emailVerificationRepository.findTopByCompanyAndTokenAndVerifiedAtIsNull(any(Company.class), anyString()))
                .thenAnswer(inv -> {
                    Company c = inv.getArgument(0);
                    String t = inv.getArgument(1);
                    return tokenStore.values().stream()
                            .filter(ev -> ev.getCompany() != null && ev.getCompany().getId().equals(c.getId())
                                    && ev.getToken().equals(t) && ev.getVerifiedAt() == null)
                            .findFirst();
                });
        when(emailVerificationRepository.findByUserOrderByExpiryDesc(any(User.class)))
                .thenAnswer(inv -> {
                    User u = inv.getArgument(0);
                    return tokenStore.values().stream()
                            .filter(ev -> ev.getUser() != null && ev.getUser().getId().equals(u.getId()))
                            .toList();
                });
        when(emailVerificationRepository.findByCompanyOrderByExpiryDesc(any(Company.class)))
                .thenAnswer(inv -> {
                    Company c = inv.getArgument(0);
                    return tokenStore.values().stream()
                            .filter(ev -> ev.getCompany() != null && ev.getCompany().getId().equals(c.getId()))
                            .toList();
                });

        credentialRepository = mock(CredentialRepository.class);
        when(credentialRepository.save(any(Credential.class))).thenAnswer(inv -> {
            Credential cr = inv.getArgument(0);
            if (cr.getId() == null) cr.setId(idGen.incrementAndGet());
            credentialStore.put(cr.getCredentialId(), cr);
            return cr;
        });
        when(credentialRepository.findByCredentialId(anyString())).thenAnswer(inv ->
                Optional.ofNullable(credentialStore.get(inv.getArgument(0))));
        when(credentialRepository.existsByInternshipAndStudent(any(Internship.class), any(Student.class)))
                .thenAnswer(inv -> {
                    Internship in = inv.getArgument(0);
                    Student s = inv.getArgument(1);
                    return credentialStore.values().stream()
                            .anyMatch(c -> c.getInternship().getId().equals(in.getId()) &&
                                    c.getStudent().getId().equals(s.getId()));
                });

        blockchainRecordRepository = mock(BlockchainRecordRepository.class);
        when(blockchainRecordRepository.save(any(BlockchainRecord.class))).thenAnswer(inv -> {
            BlockchainRecord br = inv.getArgument(0);
            if (br.getId() == null) br.setId(idGen.incrementAndGet());
            String credKey = br.getCredential() != null ? br.getCredential().getCredentialId() : "id_" + br.getId();
            blockchainRecordStore.put(credKey, br);
            return br;
        });

        // 2. Mocks for external microservices and security
        passwordEncoder = mock(PasswordEncoder.class);
        when(passwordEncoder.encode(anyString())).thenAnswer(inv -> "bcrypt_" + inv.getArgument(0));

        authenticationManager = mock(AuthenticationManager.class);
        jwtService = mock(JwtService.class);
        when(jwtService.createAccessToken(any(User.class))).thenReturn("mock_access_jwt");
        when(jwtService.createRefreshToken(any(User.class))).thenReturn("mock_refresh_jwt");

        aiServiceClient = mock(AiServiceClient.class);
        blockchainService = mock(BlockchainService.class);
        emailService = mock(EmailService.class);

        // 3. Assemble Service Layer with real business logic
        emailVerificationService = new EmailVerificationService(
                emailVerificationRepository,
                companyRepository,
                userRepository,
                emailService,
                passwordEncoder
        );

        authService = new AuthService(
                userRepository,
                studentRepository,
                companyRepository,
                passwordEncoder,
                authenticationManager,
                jwtService,
                emailVerificationService
        );

        studentService = new StudentService(
                userRepository,
                studentRepository,
                aiServiceClient,
                tempUploadDir.toString()
        );

        riskAssessmentService = new RiskAssessmentService(
                internshipRepository,
                riskAssessmentRepository
        );

        internshipService = new InternshipService(
                userRepository,
                companyRepository,
                internshipRepository,
                riskAssessmentService
        );

        recommendationService = new RecommendationService(
                userRepository,
                studentRepository,
                internshipRepository,
                recommendationRepository,
                riskAssessmentRepository,
                applicationRepository,
                aiServiceClient
        );

        applicationService = new ApplicationService(
                applicationRepository,
                internshipRepository,
                studentRepository,
                companyRepository,
                userRepository
        );

        credentialService = new CredentialService(
                credentialRepository,
                blockchainRecordRepository,
                applicationRepository,
                companyRepository,
                studentRepository,
                userRepository,
                blockchainService
        );
    }

    @Test
    @DisplayName("Complete End-to-End Flow: Registration -> Resume -> Recommendation -> Application -> Email Verification -> Completion -> Credential -> Verification")
    void executeFullEndToEndFlow() {

        // =========================================================================
        // STEP 1: Registration (Student & Company)
        // =========================================================================
        String studentEmail = "maya.lin@stanford.edu";
        RegisterRequest studentReg = new RegisterRequest();
        studentReg.setName("Maya Lin");
        studentReg.setEmail(studentEmail);
        studentReg.setPassword("StudentPass123!");
        studentReg.setRole(UserRole.STUDENT);

        RegisterResponse studentRegResp = authService.register(studentReg);
        assertNotNull(studentRegResp);
        assertTrue(studentRegResp.isRequiresVerification());
        assertEquals(UserRole.STUDENT, studentRegResp.getRole());
        assertEquals(studentEmail, studentRegResp.getEmail());

        String companyEmail = "recruiting@quantumleap.tech";
        RegisterRequest companyReg = new RegisterRequest();
        companyReg.setName("Quantum Lead");
        companyReg.setEmail(companyEmail);
        companyReg.setPassword("CompanyPass123!");
        companyReg.setRole(UserRole.COMPANY);
        companyReg.setCompanyName("Quantum Leap Technologies");

        RegisterResponse companyRegResp = authService.register(companyReg);
        assertNotNull(companyRegResp);
        assertTrue(companyRegResp.isRequiresVerification());
        assertEquals(UserRole.COMPANY, companyRegResp.getRole());

        // Verify initial entities in database
        User studentUser = userEmailStore.get(studentEmail);
        assertNotNull(studentUser);
        User companyUser = userEmailStore.get(companyEmail);
        assertNotNull(companyUser);
        Company company = companyStore.values().stream()
                .filter(c -> c.getEmail().equals(companyEmail))
                .findFirst().orElseThrow();
        assertFalse(company.isEmailVerified());

        // Verify that registration automatically triggered 6-digit verification code generation for both student and company
        assertEquals(2, tokenStore.size(), "Verification codes must be generated upon student and company registration");
        EmailVerification studentVerification = tokenStore.values().stream()
                .filter(ev -> ev.getUser() != null)
                .findFirst().orElseThrow();
        String studentCode = studentVerification.getToken();
        assertNotNull(studentCode);
        assertEquals(6, studentCode.length());

        EmailVerification companyVerification = tokenStore.values().stream()
                .filter(ev -> ev.getCompany() != null)
                .findFirst().orElseThrow();
        String verificationToken = companyVerification.getToken();
        assertNotNull(verificationToken);
        assertEquals(6, verificationToken.length());

        // Complete student email verification via 6-digit code to receive JWT tokens
        AuthResponse studentAuth = authService.verifyCode(new VerifyCodeRequest(studentEmail, studentCode));
        assertNotNull(studentAuth);
        assertEquals("mock_access_jwt", studentAuth.getAccessToken());
        assertEquals(UserRole.STUDENT, studentAuth.getUser().getRole());
        assertEquals(studentEmail, studentAuth.getUser().getEmail());

        // =========================================================================
        // STEP 2: Resume Upload & SBERT AI Profile Extraction
        // =========================================================================
        MockMultipartFile resumeFile = new MockMultipartFile(
                "file",
                "maya_lin_resume.pdf",
                "application/pdf",
                "%PDF-1.4 Mock Resume: Maya Lin, Skills: Java, Spring Boot, PyTorch, Distributed Systems".getBytes()
        );

        // Mock AI microservice resume text extraction (Design Rule #5)
        ResumeExtractionResult aiExtraction = new ResumeExtractionResult();
        aiExtraction.setSkills("Java, Spring Boot, PyTorch, Distributed Systems, SQL");
        aiExtraction.setEducation("B.S. in Computer Science, Stanford University");
        aiExtraction.setExperience("Distributed Systems Lab Research Assistant");
        aiExtraction.setProjects("High-Throughput Consensus Engine, Cloud Job Scheduler");
        aiExtraction.setCertifications("Certified Kubernetes Application Developer");
        aiExtraction.setInterests("Consensus Algorithms, Cloud Infrastructure");

        when(aiServiceClient.extractResume(any(byte[].class), eq("maya_lin_resume.pdf")))
                .thenReturn(Optional.of(aiExtraction));

        ResumeUploadResponse uploadResponse = studentService.uploadResume(studentEmail, resumeFile);
        assertNotNull(uploadResponse);
        assertTrue(uploadResponse.isAiExtractionSucceeded());
        assertEquals("Java, Spring Boot, PyTorch, Distributed Systems, SQL", uploadResponse.getSkills());

        // Confirm student profile is populated in storage
        StudentProfileResponse profile = studentService.getProfile(studentEmail);
        assertNotNull(profile);
        assertEquals("Java, Spring Boot, PyTorch, Distributed Systems, SQL", profile.getSkills());
        assertEquals("B.S. in Computer Science, Stanford University", profile.getEducation());

        // =========================================================================
        // STEP 3: Internship Posting, Heuristic Risk Assessment & AI Recommendation
        // =========================================================================
        // Enrich company profile details so incomplete-company penalty is not triggered
        company.setDescription("Quantum Leap Technologies builds distributed cloud infrastructure.");
        company.setWebsite("https://quantumleap.tech");
        company.setCountry("United States");

        InternshipRequest internshipReq = new InternshipRequest();
        internshipReq.setTitle("Distributed Systems Engineer Intern");
        internshipReq.setDescription("Build high-performance distributed key-value stores using Java and Spring Boot.");
        internshipReq.setRequiredSkills("Java, Distributed Systems, Spring Boot");
        internshipReq.setCountry("United States");
        internshipReq.setCity("San Francisco");
        internshipReq.setWorkMode("REMOTE");
        internshipReq.setDuration("3 months");
        internshipReq.setStipend(new BigDecimal("4500.00"));
        internshipReq.setCurrency("USD");
        internshipReq.setEligibility("Undergraduate or graduate students in CS or related fields");
        internshipReq.setVisaInformation("J-1 and CPT/OPT eligible");
        internshipReq.setDeadline(LocalDate.now().plusMonths(2));

        InternshipResponse postedInternship = internshipService.create(companyEmail, internshipReq);
        assertNotNull(postedInternship);
        assertEquals("OPEN", postedInternship.getStatus());
        Long internshipId = postedInternship.getId();

        // Verify automated Risk Assessment (Design Rule #3):
        // Raw score is low since legitimate posting; score must be <= 100
        assertNotNull(postedInternship.getRiskScore());
        assertTrue(postedInternship.getRiskScore() <= 100,
                "Risk assessment score must be capped at 100 per Design Rule #3");
        assertEquals("LOW", postedInternship.getRiskLevel());

        // Mock AI Microservice semantic similarity matcher (Design Rule #5)
        MatchResultItem matchItem = new MatchResultItem(internshipId, 0.91);
        when(aiServiceClient.match(anyString(), anyList()))
                .thenReturn(Optional.of(new MatchResponse(List.of(matchItem), true)));

        // Student generates AI recommendations (Design Rule #1: Hard filters executed before AI)
        InternshipSearchParams hardFilters = new InternshipSearchParams();
        hardFilters.setCountry("United States");
        hardFilters.setWorkMode("REMOTE");

        RecommendationListResponse recommendations =
                recommendationService.generateRecommendations(studentEmail, hardFilters);

        assertNotNull(recommendations);
        assertTrue(recommendations.isHasProfile());
        assertEquals(1, recommendations.getRecommendations().size());

        RecommendationItemResponse topRec = recommendations.getRecommendations().get(0);
        assertEquals(internshipId, topRec.getInternshipId());
        assertEquals(1, topRec.getRanking());
        // Design Rule #2: Raw cosine similarity score stored as ranking signal (never percentage / probability)
        assertEquals(0.91, topRec.getSimilarityScore());
        // Phase 1 verification: Explainability and skill gap populated
        assertNotNull(topRec.getMatchingStrengths());
        assertFalse(topRec.getMatchingStrengths().isEmpty());
        assertNotNull(topRec.getFitLevel());

        // Recommendation Dashboard verification
        StudentRecommendationDashboardResponse dashboardResp =
                recommendationService.getStudentDashboard(studentEmail);
        assertNotNull(dashboardResp);
        assertTrue(dashboardResp.isHasProfile());
        assertEquals(1, dashboardResp.getTotalRecommended());
        assertEquals(0.91, dashboardResp.getTopMatchScore());
        assertEquals("Best Match", dashboardResp.getTopMatchFitLevel());

        // =========================================================================
        // STEP 4: Application Submission
        // =========================================================================
        ApplyRequest applyReq = new ApplyRequest();
        applyReq.setInternshipId(internshipId);

        ApplicationResponse appResponse = applicationService.apply(studentEmail, applyReq);
        assertNotNull(appResponse);
        Long applicationId = appResponse.getId();
        assertEquals(ApplicationStatus.APPLIED, appResponse.getStatus());
        assertEquals(internshipId, appResponse.getInternshipId());

        // Verify duplicate application prevention
        ApiException conflictEx = assertThrows(ApiException.class,
                () -> applicationService.apply(studentEmail, applyReq));
        assertEquals(HttpStatus.CONFLICT, conflictEx.getStatus());

        // =========================================================================
        // STEP 5: Company Domain Email Verification (Design Rule #4)
        // =========================================================================
        VerifyEmailResponse verifyResponse = emailVerificationService.verifyEmail(verificationToken);
        assertNotNull(verifyResponse);
        assertTrue(verifyResponse.isVerified());
        assertTrue(company.isEmailVerified(), "Company email_verified must now be true");

        // Design Rule #4 compliance: Must include notice clarifying inbox control only
        assertNotNull(verifyResponse.getNotice());
        assertTrue(verifyResponse.getNotice().contains("Design Rule #4"),
                "Verification response must explicitly cite Design Rule #4");
        assertTrue(verifyResponse.getNotice().contains("inbox only"),
                "Verification notice must clarify that inbox control is verified, not legal identity");

        // =========================================================================
        // STEP 6: Application Review & Completion Lifecycle Transition
        // =========================================================================
        // Company advances application: APPLIED -> ACCEPTED
        UpdateApplicationStatusRequest acceptReq = new UpdateApplicationStatusRequest();
        acceptReq.setStatus(ApplicationStatus.ACCEPTED);
        ApplicationResponse acceptedApp = applicationService.updateStatus(applicationId, companyEmail, acceptReq);
        assertEquals(ApplicationStatus.ACCEPTED, acceptedApp.getStatus());

        // Company marks completion: ACCEPTED -> COMPLETED
        UpdateApplicationStatusRequest completeReq = new UpdateApplicationStatusRequest();
        completeReq.setStatus(ApplicationStatus.COMPLETED);
        ApplicationResponse completedApp = applicationService.updateStatus(applicationId, companyEmail, completeReq);
        assertEquals(ApplicationStatus.COMPLETED, completedApp.getStatus());

        // =========================================================================
        // STEP 7: Blockchain Credential Issuance & SHA-256 Anchoring
        // =========================================================================
        IssueCredentialRequest issueReq = new IssueCredentialRequest();
        issueReq.setApplicationId(applicationId);

        String mockTxHash = "0x8f73b9e4a2c01d9f83a4b6c2e1785d09f7a3b2c1e4d5a6b7c8d9e0f1a2b3c4d5";
        when(blockchainService.issueCredentialOnChain(anyString(), anyString(), anyString(), anyLong()))
                .thenReturn(mockTxHash);

        CredentialResponse issuedCred = credentialService.issueCredential(issueReq, companyEmail);
        assertNotNull(issuedCred);
        assertNotNull(issuedCred.getCredentialId());
        assertTrue(issuedCred.getCredentialId().startsWith("CRED-"));
        assertEquals(mockTxHash, issuedCred.getBlockchainTx());
        assertNotNull(issuedCred.getHash(), "SHA-256 cryptographic hash must be computed");
        assertEquals(64, issuedCred.getHash().length(), "SHA-256 hash must be 64 hex characters");

        String credentialId = issuedCred.getCredentialId();
        String expectedHash = issuedCred.getHash();

        // =========================================================================
        // STEP 8: Public Credential Verification & Ledger Cryptographic Audit
        // =========================================================================
        // Mock on-chain query response from the blockchain smart contract registry
        BlockchainService.OnChainRecord onChainRecord = new BlockchainService.OnChainRecord(
                true,
                expectedHash,
                "Quantum Leap Technologies",
                Instant.now(),
                "0x5FbDB2315678afecb367f032d93F642f64180aa3",
                "hardhat-local"
        );
        when(blockchainService.verifyCredentialOnChain(credentialId)).thenReturn(onChainRecord);

        PublicVerifyResponse publicVerify = credentialService.verifyCredential(credentialId);

        assertNotNull(publicVerify);
        assertEquals(VerificationStatus.VERIFIED, publicVerify.getStatus(),
                "Verification status must be VERIFIED when on-chain hash matches platform hash");
        assertTrue(publicVerify.getHashMatch(),
                "Cryptographic hash match must be true");
        assertNotNull(publicVerify.getPlatformRecord());
        assertEquals(credentialId, publicVerify.getPlatformRecord().getCredentialId());
        assertEquals("Maya Lin", publicVerify.getPlatformRecord().getStudentName());
        assertEquals("Quantum Leap Technologies", publicVerify.getPlatformRecord().getCompanyName());
        assertEquals("Distributed Systems Engineer Intern", publicVerify.getPlatformRecord().getInternshipTitle());
        assertEquals(expectedHash, publicVerify.getPlatformRecord().getPlatformHash());

        assertNotNull(publicVerify.getOnChainRecord());
        assertTrue(publicVerify.getOnChainRecord().isExists());
        assertEquals(expectedHash, publicVerify.getOnChainRecord().getCredentialHash());
        assertEquals("Quantum Leap Technologies", publicVerify.getOnChainRecord().getIssuer());

        // End of full E2E flow
    }
}
