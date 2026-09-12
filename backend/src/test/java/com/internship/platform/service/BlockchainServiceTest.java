package com.internship.platform.service;

import com.internship.platform.exception.ApiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.*;

class BlockchainServiceTest {

    private static final String FAKE_RPC = "http://127.0.0.1:8545";
    private static final String FAKE_CONTRACT = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    private static final String FAKE_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    @Test
    @DisplayName("issueCredentialOnChain: Throws SERVICE_UNAVAILABLE when contract address is missing")
    void issueCredentialOnChain_missingContractAddress_throwsServiceUnavailable() {
        BlockchainService service = new BlockchainService(
                FAKE_RPC,
                "", // empty contract address
                "hardhat-local",
                FAKE_PRIVATE_KEY
        );

        ApiException ex = assertThrows(ApiException.class, () ->
                service.issueCredentialOnChain("CRED-123", "hash123", "Acme Corp", 1700000000L));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatus());
        assertTrue(ex.getMessage().contains("contract address is not configured"));
    }

    @Test
    @DisplayName("issueCredentialOnChain: Throws SERVICE_UNAVAILABLE when private key is not configured")
    void issueCredentialOnChain_missingPrivateKey_throwsServiceUnavailable() {
        BlockchainService service = new BlockchainService(
                FAKE_RPC,
                FAKE_CONTRACT,
                "hardhat-local",
                "" // empty private key
        );

        ApiException ex = assertThrows(ApiException.class, () ->
                service.issueCredentialOnChain("CRED-123", "hash123", "Acme Corp", 1700000000L));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatus());
        assertTrue(ex.getMessage().contains("private key"));
    }

    @Test
    @DisplayName("verifyCredentialOnChain: Gracefully returns exists=false when RPC node is offline/unreachable")
    void verifyCredentialOnChain_unreachableRpc_returnsRecordWithExistsFalse() {
        // Point to an unused local port that will refuse connection
        BlockchainService service = new BlockchainService(
                "http://127.0.0.1:59999",
                FAKE_CONTRACT,
                "hardhat-local",
                FAKE_PRIVATE_KEY
        );

        BlockchainService.OnChainRecord record = service.verifyCredentialOnChain("CRED-NONEXISTENT");

        assertNotNull(record);
        assertFalse(record.exists());
        assertEquals("", record.credentialHash());
        assertEquals(FAKE_CONTRACT, record.contractAddress());
        assertEquals("hardhat-local", record.network());
    }

    @Test
    @DisplayName("verifyCredentialOnChain: Gracefully returns exists=false when contract address is blank")
    void verifyCredentialOnChain_missingContractAddress_returnsRecordWithExistsFalse() {
        BlockchainService service = new BlockchainService(
                FAKE_RPC,
                null,
                "hardhat-local",
                FAKE_PRIVATE_KEY
        );

        BlockchainService.OnChainRecord record = service.verifyCredentialOnChain("CRED-ANY");

        assertNotNull(record);
        assertFalse(record.exists());
    }
}
