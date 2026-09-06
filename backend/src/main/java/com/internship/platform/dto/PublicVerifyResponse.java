package com.internship.platform.dto;

import java.time.Instant;
import java.time.LocalDate;

public class PublicVerifyResponse {

    public enum VerificationStatus {
        VERIFIED,
        MISMATCH,
        NOT_FOUND
    }

    private VerificationStatus status;
    private String credentialId;
    private String message;
    private boolean verified;
    private Boolean hashMatch;
    private OnChainInfo onChainRecord;
    private PlatformInfo platformRecord;
    private Instant verifiedAt;

    public PublicVerifyResponse() {
        this.verifiedAt = Instant.now();
    }

    public static class OnChainInfo {
        private boolean exists;
        private String credentialHash;
        private String issuer;
        private Instant timestamp;
        private String contractAddress;
        private String network;

        public OnChainInfo() {
        }

        public boolean isExists() {
            return exists;
        }

        public void setExists(boolean exists) {
            this.exists = exists;
        }

        public String getCredentialHash() {
            return credentialHash;
        }

        public void setCredentialHash(String credentialHash) {
            this.credentialHash = credentialHash;
        }

        public String getIssuer() {
            return issuer;
        }

        public void setIssuer(String issuer) {
            this.issuer = issuer;
        }

        public Instant getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(Instant timestamp) {
            this.timestamp = timestamp;
        }

        public String getContractAddress() {
            return contractAddress;
        }

        public void setContractAddress(String contractAddress) {
            this.contractAddress = contractAddress;
        }

        public String getNetwork() {
            return network;
        }

        public void setNetwork(String network) {
            this.network = network;
        }
    }

    public static class PlatformInfo {
        private String credentialId;
        private String studentName;
        private String companyName;
        private String internshipTitle;
        private LocalDate completionDate;
        private String platformHash;
        private String transactionHash;

        public PlatformInfo() {
        }

        public String getCredentialId() {
            return credentialId;
        }

        public void setCredentialId(String credentialId) {
            this.credentialId = credentialId;
        }

        public String getStudentName() {
            return studentName;
        }

        public void setStudentName(String studentName) {
            this.studentName = studentName;
        }

        public String getCompanyName() {
            return companyName;
        }

        public void setCompanyName(String companyName) {
            this.companyName = companyName;
        }

        public String getInternshipTitle() {
            return internshipTitle;
        }

        public void setInternshipTitle(String internshipTitle) {
            this.internshipTitle = internshipTitle;
        }

        public LocalDate getCompletionDate() {
            return completionDate;
        }

        public void setCompletionDate(LocalDate completionDate) {
            this.completionDate = completionDate;
        }

        public String getPlatformHash() {
            return platformHash;
        }

        public void setPlatformHash(String platformHash) {
            this.platformHash = platformHash;
        }

        public String getTransactionHash() {
            return transactionHash;
        }

        public void setTransactionHash(String transactionHash) {
            this.transactionHash = transactionHash;
        }
    }

    public VerificationStatus getStatus() {
        return status;
    }

    public void setStatus(VerificationStatus status) {
        this.status = status;
        this.verified = (status == VerificationStatus.VERIFIED);
    }

    public String getCredentialId() {
        return credentialId;
    }

    public void setCredentialId(String credentialId) {
        this.credentialId = credentialId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public Boolean getHashMatch() {
        return hashMatch;
    }

    public void setHashMatch(Boolean hashMatch) {
        this.hashMatch = hashMatch;
    }

    public OnChainInfo getOnChainRecord() {
        return onChainRecord;
    }

    public void setOnChainRecord(OnChainInfo onChainRecord) {
        this.onChainRecord = onChainRecord;
    }

    public PlatformInfo getPlatformRecord() {
        return platformRecord;
    }

    public void setPlatformRecord(PlatformInfo platformRecord) {
        this.platformRecord = platformRecord;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }
}
