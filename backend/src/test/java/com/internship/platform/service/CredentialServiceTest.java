package com.internship.platform.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.internship.platform.dto.CredentialResponse;
import com.internship.platform.dto.IssueCredentialRequest;
import com.internship.platform.dto.PublicVerifyResponse;
import com.internship.platform.dto.PublicVerifyResponse.VerificationStatus;
import com.internship.platform.entity.Application;
import com.internship.platform.entity.ApplicationStatus;
import com.internship.platform.entity.BlockchainRecord;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Credential;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.Student;
import com.internship.platform.entity.User;
import com.internship.platform.entity.UserRole;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.ApplicationRepository;
import com.internship.platform.repository.BlockchainRecordRepository;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.CredentialRepository;
import com.internship.platform.repository.StudentRepository;
import com.internship.platform.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class CredentialServiceTest {

    @Mock
    private CredentialRepository credentialRepository;

    @Mock
    private BlockchainRecordRepository blockchainRecordRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BlockchainService blockchainService;

    private CredentialService credentialService;

    private User companyUser;
    private Company company;
    private User studentUser;
    private Student student;
    private Internship internship;
    private Application completedApplication;

    @BeforeEach
    void setUp() {
        credentialService = new CredentialService(
                credentialRepository,
                blockchainRecordRepository,
                applicationRepository,
                companyRepository,
                studentRepository,
                userRepository,
                blockchainService
        );

        companyUser = new User();
        companyUser.setId(10L);
        companyUser.setEmail("careers@acme.com");
        companyUser.setName("Acme Recruiter");
        companyUser.setRole(UserRole.COMPANY);

        company = new Company();
        company.setId(100L);
        company.setUser(companyUser);
        company.setCompanyName("Acme Corp");
        company.setEmail("careers@acme.com");

        studentUser = new User();
        studentUser.setId(20L);
        studentUser.setEmail("alice@university.edu");
        studentUser.setName("Alice Smith");
        studentUser.setRole(UserRole.STUDENT);

        student = new Student();
        student.setId(200L);
        student.setUser(studentUser);

        internship = new Internship();
        internship.setId(300L);
        internship.setCompany(company);
        internship.setTitle("Full Stack Engineer Intern");

        completedApplication = new Application();
        completedApplication.setId(400L);
        completedApplication.setStudent(student);
        completedApplication.setInternship(internship);
        completedApplication.setStatus(ApplicationStatus.COMPLETED);
    }

    @Test
    void testCanonicalizationAndHashDeterminism() {
        Credential cred1 = new Credential();
        cred1.setCredentialId("CRED-TEST-1234");
        cred1.setStudent(student);
        cred1.setCompany(company);
        cred1.setInternship(internship);
        cred1.setCompletionDate(LocalDate.of(2026, 9, 6));

        Credential cred2 = new Credential();
        cred2.setCredentialId("CRED-TEST-1234");
        cred2.setStudent(student);
        cred2.setCompany(company);
        cred2.setInternship(internship);
        cred2.setCompletionDate(LocalDate.of(2026, 9, 6));

        String canon1 = credentialService.canonicalize(cred1);
        String canon2 = credentialService.canonicalize(cred2);
        assertEquals(canon1, canon2);

        String hash1 = credentialService.calculateSha256(canon1);
        String hash2 = credentialService.calculateSha256(canon2);
        assertEquals(hash1, hash2);
        assertEquals(64, hash1.length(), "SHA-256 hash must be 64 lowercase hex characters");

        // Altering a field changes hash
        cred2.setCompletionDate(LocalDate.of(2026, 9, 7));
        String alteredHash = credentialService.calculateSha256(credentialService.canonicalize(cred2));
        assertFalse(hash1.equals(alteredHash));
    }

    @Test
    void testSuccessfulCredentialIssuance() {
        IssueCredentialRequest request = new IssueCredentialRequest(400L);

        when(userRepository.findByEmail("careers@acme.com")).thenReturn(Optional.of(companyUser));
        when(companyRepository.findByUser(companyUser)).thenReturn(Optional.of(company));
        when(applicationRepository.findById(400L)).thenReturn(Optional.of(completedApplication));
        when(credentialRepository.existsByInternshipAndStudent(internship, student)).thenReturn(false);

        when(blockchainService.issueCredentialOnChain(anyString(), anyString(), eq("Acme Corp"), anyLong()))
                .thenReturn("0xdeadbeef1234567890abcdef");
        when(blockchainService.getContractAddress()).thenReturn("0x5FbDB2315678afecb367f032d93F642f64180aa3");
        when(blockchainService.getNetwork()).thenReturn("hardhat-local");

        when(credentialRepository.save(any(Credential.class))).thenAnswer(invocation -> {
            Credential c = invocation.getArgument(0);
            c.setId(1L);
            return c;
        });

        CredentialResponse response = credentialService.issueCredential(request, "careers@acme.com");

        assertNotNull(response);
        assertNotNull(response.getCredentialId());
        assertTrue(response.getCredentialId().startsWith("CRED-"));
        assertEquals("Alice Smith", response.getStudentName());
        assertEquals("Acme Corp", response.getCompanyName());
        assertEquals("Full Stack Engineer Intern", response.getInternshipTitle());
        assertEquals("0xdeadbeef1234567890abcdef", response.getBlockchainTx());
        assertEquals("0x5FbDB2315678afecb367f032d93F642f64180aa3", response.getContractAddress());

        verify(blockchainRecordRepository).save(any(BlockchainRecord.class));
    }

    @Test
    void testRejectsIssuanceForNonCompletedApplication() {
        completedApplication.setStatus(ApplicationStatus.ACCEPTED);
        IssueCredentialRequest request = new IssueCredentialRequest(400L);

        when(userRepository.findByEmail("careers@acme.com")).thenReturn(Optional.of(companyUser));
        when(companyRepository.findByUser(companyUser)).thenReturn(Optional.of(company));
        when(applicationRepository.findById(400L)).thenReturn(Optional.of(completedApplication));

        ApiException ex = assertThrows(ApiException.class, () ->
                credentialService.issueCredential(request, "careers@acme.com")
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("COMPLETED"));
        verify(blockchainService, never()).issueCredentialOnChain(any(), any(), any(), anyLong());
    }

    @Test
    void testRejectsIssuanceByUnauthorizedCompany() {
        Company otherCompany = new Company();
        otherCompany.setId(999L);
        otherCompany.setCompanyName("Malicious Corp");

        IssueCredentialRequest request = new IssueCredentialRequest(400L);

        when(userRepository.findByEmail("other@malicious.com")).thenReturn(Optional.of(companyUser));
        when(companyRepository.findByUser(companyUser)).thenReturn(Optional.of(otherCompany));
        when(applicationRepository.findById(400L)).thenReturn(Optional.of(completedApplication));

        ApiException ex = assertThrows(ApiException.class, () ->
                credentialService.issueCredential(request, "other@malicious.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        verify(blockchainService, never()).issueCredentialOnChain(any(), any(), any(), anyLong());
    }

    @Test
    void testRejectsDuplicateIssuance() {
        IssueCredentialRequest request = new IssueCredentialRequest(400L);

        when(userRepository.findByEmail("careers@acme.com")).thenReturn(Optional.of(companyUser));
        when(companyRepository.findByUser(companyUser)).thenReturn(Optional.of(company));
        when(applicationRepository.findById(400L)).thenReturn(Optional.of(completedApplication));
        when(credentialRepository.existsByInternshipAndStudent(internship, student)).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () ->
                credentialService.issueCredential(request, "careers@acme.com")
        );

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(blockchainService, never()).issueCredentialOnChain(any(), any(), any(), anyLong());
    }

    @Test
    void testPublicVerifyReturnsVerifiedWhenHashesMatch() {
        String credId = "CRED-MATCH-001";
        String sampleHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

        Credential cred = new Credential();
        cred.setCredentialId(credId);
        cred.setStudent(student);
        cred.setCompany(company);
        cred.setInternship(internship);
        cred.setCompletionDate(LocalDate.of(2026, 9, 6));
        cred.setHash(sampleHash);
        cred.setBlockchainTx("0x123abc");

        when(credentialRepository.findByCredentialId(credId)).thenReturn(Optional.of(cred));
        when(blockchainService.verifyCredentialOnChain(credId)).thenReturn(
                new BlockchainService.OnChainRecord(
                        true,
                        sampleHash,
                        "Acme Corp",
                        Instant.ofEpochSecond(1725624000L),
                        "0xContract",
                        "hardhat-local"
                )
        );

        PublicVerifyResponse resp = credentialService.verifyCredential(credId);

        assertEquals(VerificationStatus.VERIFIED, resp.getStatus());
        assertTrue(resp.isVerified());
        assertTrue(resp.getHashMatch());
        assertNotNull(resp.getOnChainRecord());
        assertNotNull(resp.getPlatformRecord());
        assertEquals("Alice Smith", resp.getPlatformRecord().getStudentName());
    }

    @Test
    void testPublicVerifyReturnsMismatchWhenHashesDiffer() {
        String credId = "CRED-MISMATCH-002";
        String platformHash = "original_database_hash_value";
        String tamperedOnChainHash = "different_blockchain_hash_value";

        Credential cred = new Credential();
        cred.setCredentialId(credId);
        cred.setStudent(student);
        cred.setCompany(company);
        cred.setInternship(internship);
        cred.setCompletionDate(LocalDate.of(2026, 9, 6));
        cred.setHash(platformHash);

        when(credentialRepository.findByCredentialId(credId)).thenReturn(Optional.of(cred));
        when(blockchainService.verifyCredentialOnChain(credId)).thenReturn(
                new BlockchainService.OnChainRecord(
                        true,
                        tamperedOnChainHash,
                        "Acme Corp",
                        Instant.now(),
                        "0xContract",
                        "hardhat-local"
                )
        );

        PublicVerifyResponse resp = credentialService.verifyCredential(credId);

        assertEquals(VerificationStatus.MISMATCH, resp.getStatus());
        assertFalse(resp.isVerified());
        assertFalse(resp.getHashMatch());
    }

    @Test
    void testPublicVerifyReturnsNotFoundWhenNonExistent() {
        String credId = "CRED-NOT-EXISTS";

        when(credentialRepository.findByCredentialId(credId)).thenReturn(Optional.empty());
        when(blockchainService.verifyCredentialOnChain(credId)).thenReturn(
                new BlockchainService.OnChainRecord(
                        false,
                        "",
                        "",
                        null,
                        "0xContract",
                        "hardhat-local"
                )
        );

        PublicVerifyResponse resp = credentialService.verifyCredential(credId);

        assertEquals(VerificationStatus.NOT_FOUND, resp.getStatus());
        assertFalse(resp.isVerified());
        assertNull(resp.getHashMatch());
    }
}
