package com.internship.platform.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internship.platform.dto.CredentialResponse;
import com.internship.platform.dto.IssueCredentialRequest;
import com.internship.platform.dto.PublicVerifyResponse;
import com.internship.platform.dto.PublicVerifyResponse.OnChainInfo;
import com.internship.platform.dto.PublicVerifyResponse.PlatformInfo;
import com.internship.platform.dto.PublicVerifyResponse.VerificationStatus;
import com.internship.platform.entity.Application;
import com.internship.platform.entity.ApplicationStatus;
import com.internship.platform.entity.BlockchainRecord;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Credential;
import com.internship.platform.entity.Student;
import com.internship.platform.entity.User;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.ApplicationRepository;
import com.internship.platform.repository.BlockchainRecordRepository;
import com.internship.platform.repository.CompanyRepository;
import com.internship.platform.repository.CredentialRepository;
import com.internship.platform.repository.StudentRepository;
import com.internship.platform.repository.UserRepository;

@Service
public class CredentialService {

    private static final Logger log = LoggerFactory.getLogger(CredentialService.class);

    private final CredentialRepository credentialRepository;
    private final BlockchainRecordRepository blockchainRecordRepository;
    private final ApplicationRepository applicationRepository;
    private final CompanyRepository companyRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final BlockchainService blockchainService;

    public CredentialService(
            CredentialRepository credentialRepository,
            BlockchainRecordRepository blockchainRecordRepository,
            ApplicationRepository applicationRepository,
            CompanyRepository companyRepository,
            StudentRepository studentRepository,
            UserRepository userRepository,
            BlockchainService blockchainService) {
        this.credentialRepository = credentialRepository;
        this.blockchainRecordRepository = blockchainRecordRepository;
        this.applicationRepository = applicationRepository;
        this.companyRepository = companyRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.blockchainService = blockchainService;
    }

    /**
     * Canonicalizes credential fields deterministically.
     * Format: credentialId:<id>|studentId:<id>|companyId:<id>|internshipId:<id>|completionDate:<YYYY-MM-DD>
     */
    public String canonicalize(Credential credential) {
        return String.format(
                "credentialId:%s|studentId:%d|companyId:%d|internshipId:%d|completionDate:%s",
                credential.getCredentialId(),
                credential.getStudent().getId(),
                credential.getCompany().getId(),
                credential.getInternship().getId(),
                credential.getCompletionDate().toString()
        );
    }

    /**
     * Generates a standard lowercase 64-hex SHA-256 hash.
     */
    public String calculateSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable in JVM", e);
        }
    }

    /**
     * Issue a blockchain-backed credential for a completed application.
     * Enforces:
     *   1. Only COMPLETED applications are eligible.
     *   2. Only the company that owns the internship can issue.
     *   3. Duplicate issuance prevention (one credential per completed internship).
     */
    @Transactional
    public CredentialResponse issueCredential(IssueCredentialRequest request, String companyUserEmail) {
        User user = userRepository.findByEmail(companyUserEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));

        Company company = companyRepository.findByUser(user)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "User is not registered as a company"));

        Application application = applicationRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));

        // Rule 1: Application must be COMPLETED
        if (application.getStatus() != ApplicationStatus.COMPLETED) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Credentials can only be issued for COMPLETED applications. Current status: " + application.getStatus());
        }

        // Rule 2: Company ownership check
        if (!application.getInternship().getCompany().getId().equals(company.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "You cannot issue a credential for an internship belonging to another company.");
        }

        // Rule 3: Duplicate prevention
        if (credentialRepository.existsByInternshipAndStudent(application.getInternship(), application.getStudent())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "A credential has already been issued for this student and internship completion.");
        }

        // Generate unique credential ID: e.g. CRED-A1B2C3D4E5F6
        String uniqueSuffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        String credentialId = "CRED-" + uniqueSuffix;

        LocalDate completionDate = application.getUpdatedAt() != null
                ? application.getUpdatedAt().atZone(ZoneId.systemDefault()).toLocalDate()
                : LocalDate.now();

        Credential credential = new Credential();
        credential.setCredentialId(credentialId);
        credential.setStudent(application.getStudent());
        credential.setCompany(company);
        credential.setInternship(application.getInternship());
        credential.setCompletionDate(completionDate);

        // Canonicalize and generate cryptographic hash
        String canonicalString = canonicalize(credential);
        String hash = calculateSha256(canonicalString);
        credential.setHash(hash);

        // Call smart contract on-chain
        long timestampSec = Instant.now().getEpochSecond();
        String txHash = blockchainService.issueCredentialOnChain(
                credentialId,
                hash,
                company.getCompanyName(),
                timestampSec
        );
        credential.setBlockchainTx(txHash);

        credential = credentialRepository.save(credential);

        // Record in blockchain_records table
        BlockchainRecord record = new BlockchainRecord();
        record.setCredential(credential);
        record.setTransactionHash(txHash);
        record.setContractAddress(blockchainService.getContractAddress());
        record.setNetwork(blockchainService.getNetwork());
        record.setTimestamp(Instant.ofEpochSecond(timestampSec));
        blockchainRecordRepository.save(record);

        log.info("Issued blockchain credential {} for student ID {} with tx {}",
                credentialId, application.getStudent().getId(), txHash);

        return mapToResponse(credential, record);
    }

    /**
     * Public credential verification endpoint (no authentication required).
     * Compares off-chain database record with on-chain smart contract state.
     */
    @Transactional(readOnly = true)
    public PublicVerifyResponse verifyCredential(String credentialId) {
        if (credentialId == null || credentialId.isBlank()) {
            PublicVerifyResponse res = new PublicVerifyResponse();
            res.setStatus(VerificationStatus.NOT_FOUND);
            res.setCredentialId(credentialId);
            res.setMessage("Credential ID cannot be blank.");
            return res;
        }

        String cleanId = credentialId.trim();
        PublicVerifyResponse response = new PublicVerifyResponse();
        response.setCredentialId(cleanId);

        // 1. Query database record
        Optional<Credential> dbCredentialOpt = credentialRepository.findByCredentialId(cleanId);

        // 2. Query blockchain ledger
        BlockchainService.OnChainRecord onChain = blockchainService.verifyCredentialOnChain(cleanId);

        // Prepare OnChainInfo
        OnChainInfo onChainInfo = new OnChainInfo();
        onChainInfo.setExists(onChain.exists());
        onChainInfo.setCredentialHash(onChain.credentialHash());
        onChainInfo.setIssuer(onChain.issuer());
        onChainInfo.setTimestamp(onChain.timestamp());
        onChainInfo.setContractAddress(onChain.contractAddress());
        onChainInfo.setNetwork(onChain.network());
        response.setOnChainRecord(onChainInfo);

        // Prepare PlatformInfo if database record exists
        if (dbCredentialOpt.isPresent()) {
            Credential cred = dbCredentialOpt.get();
            PlatformInfo platformInfo = new PlatformInfo();
            platformInfo.setCredentialId(cred.getCredentialId());
            platformInfo.setStudentName(cred.getStudent().getUser().getName());
            platformInfo.setCompanyName(cred.getCompany().getCompanyName());
            platformInfo.setInternshipTitle(cred.getInternship().getTitle());
            platformInfo.setCompletionDate(cred.getCompletionDate());
            platformInfo.setPlatformHash(cred.getHash());
            platformInfo.setTransactionHash(cred.getBlockchainTx());
            response.setPlatformRecord(platformInfo);
        }

        // Evaluate verification status
        if (!onChain.exists() && dbCredentialOpt.isEmpty()) {
            response.setStatus(VerificationStatus.NOT_FOUND);
            response.setMessage("Credential not found on blockchain registry or platform database.");
            response.setHashMatch(null);
            return response;
        }

        if (onChain.exists() && dbCredentialOpt.isPresent()) {
            Credential cred = dbCredentialOpt.get();
            boolean hashesMatch = onChain.credentialHash().equalsIgnoreCase(cred.getHash());
            response.setHashMatch(hashesMatch);

            if (hashesMatch) {
                response.setStatus(VerificationStatus.VERIFIED);
                response.setMessage("Credential successfully verified against the blockchain registry. Cryptographic hashes match.");
            } else {
                response.setStatus(VerificationStatus.MISMATCH);
                response.setMessage("Hash mismatch detected! The on-chain cryptographic hash does not match platform records. Credential may have been altered.");
            }
            return response;
        }

        // Exists in one store but not the other
        response.setStatus(VerificationStatus.MISMATCH);
        response.setHashMatch(false);
        response.setMessage("Discrepancy detected: Credential exists in only one system (blockchain or database). Integrity cannot be verified.");
        return response;
    }

    @Transactional(readOnly = true)
    public List<CredentialResponse> getStudentCredentials(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        Student student = studentRepository.findByUser(user)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "User is not registered as a student"));

        return credentialRepository.findByStudentOrderByCompletionDateDesc(student)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CredentialResponse> getCompanyCredentials(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        Company company = companyRepository.findByUser(user)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "User is not registered as a company"));

        return credentialRepository.findByCompanyOrderByCompletionDateDesc(company)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CredentialResponse getCredentialById(String credentialId) {
        Credential credential = credentialRepository.findByCredentialId(credentialId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Credential not found"));
        return mapToResponse(credential);
    }

    private CredentialResponse mapToResponse(Credential credential) {
        Optional<BlockchainRecord> recordOpt = blockchainRecordRepository.findByCredential(credential);
        return mapToResponse(credential, recordOpt.orElse(null));
    }

    private CredentialResponse mapToResponse(Credential credential, BlockchainRecord record) {
        CredentialResponse resp = new CredentialResponse();
        resp.setId(credential.getId());
        resp.setCredentialId(credential.getCredentialId());
        resp.setStudentId(credential.getStudent().getId());
        resp.setStudentName(credential.getStudent().getUser().getName());
        resp.setStudentEmail(credential.getStudent().getUser().getEmail());
        resp.setCompanyId(credential.getCompany().getId());
        resp.setCompanyName(credential.getCompany().getCompanyName());
        resp.setInternshipId(credential.getInternship().getId());
        resp.setInternshipTitle(credential.getInternship().getTitle());
        resp.setCompletionDate(credential.getCompletionDate());
        resp.setHash(credential.getHash());
        resp.setBlockchainTx(credential.getBlockchainTx());

        if (record != null) {
            resp.setContractAddress(record.getContractAddress());
            resp.setNetwork(record.getNetwork());
            resp.setIssuedAt(record.getTimestamp());
        } else {
            resp.setContractAddress(blockchainService.getContractAddress());
            resp.setNetwork(blockchainService.getNetwork());
        }

        return resp;
    }
}
