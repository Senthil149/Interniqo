package com.internship.platform.service;

import java.math.BigInteger;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Bool;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.Utf8String;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.EthCall;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.response.PollingTransactionReceiptProcessor;
import org.web3j.tx.response.TransactionReceiptProcessor;

import com.internship.platform.exception.ApiException;

/**
 * Service managing Web3j Ethereum interaction with the CredentialRegistry smart contract.
 *
 * Implements Design Rule #5:
 *   AI and blockchain remain separate HTTP/RPC services — never inlined into Spring Boot.
 *
 * NOTE FOR REAL NETWORK DEPLOYMENT:
 * 1. Network Provider & RPC: Replace the local RPC endpoint (http://127.0.0.1:8545) with a secure
 *    Infura, Alchemy, or QuickNode HTTPS endpoint pointing to a testnet (e.g. Ethereum Sepolia,
 *    Arbitrum Sepolia, Polygon Amoy) or mainnet.
 * 2. Key Management: DO NOT inject raw private keys in plain text properties. In production, use
 *    AWS KMS, Google Cloud KMS, HashiCorp Vault, or an ERC-4337 Account Abstraction paymaster/bundler.
 * 3. Gas Strategy: Transition to dynamic EIP-1559 gas pricing by estimating maxFeePerGas and
 *    maxPriorityFeePerGas from eth_feeHistory rather than static legacy gas price.
 * 4. Nonce Management: For high-concurrency issuance, use a centralized database nonce queue or
 *    FastRawTransactionManager with atomic nonce synchronization to prevent nonce collisions.
 * 5. Chain ID: Configure the chainId matching the target network (e.g. 11155111 for Sepolia, 80002 for Polygon Amoy).
 */
@Service
public class BlockchainService {

    private static final Logger log = LoggerFactory.getLogger(BlockchainService.class);

    private final String rpcUrl;
    private final String contractAddress;
    private final String network;
    private final String privateKey;

    private final Web3j web3j;
    private final Credentials credentials;

    public BlockchainService(
            @Value("${blockchain.rpc-url}") String rpcUrl,
            @Value("${blockchain.contract-address}") String contractAddress,
            @Value("${blockchain.network:hardhat-local}") String network,
            @Value("${blockchain.private-key}") String privateKey) {
        this.rpcUrl = rpcUrl;
        this.contractAddress = contractAddress;
        this.network = network;
        this.privateKey = privateKey;

        this.web3j = Web3j.build(new HttpService(rpcUrl));
        Credentials creds = null;
        try {
            if (privateKey != null && !privateKey.isBlank()) {
                creds = Credentials.create(privateKey);
            }
        } catch (Exception e) {
            log.warn("Could not load blockchain private key: {}", e.getMessage());
        }
        this.credentials = creds;
    }

    /**
     * DTO representing on-chain credential verification result.
     */
    public record OnChainRecord(
            boolean exists,
            String credentialHash,
            String issuer,
            Instant timestamp,
            String contractAddress,
            String network
    ) {}

    /**
     * Issues a credential by submitting a signed transaction to the CredentialRegistry contract.
     *
     * @param credentialId   Unique platform identifier (e.g., CRED-...)
     * @param credentialHash Cryptographic SHA-256 hash of canonical credential fields
     * @param issuer         Name of the issuing company
     * @param timestamp      Unix epoch timestamp in seconds
     * @return On-chain transaction hash
     */
    public String issueCredentialOnChain(
            String credentialId,
            String credentialHash,
            String issuer,
            long timestamp) {

        if (contractAddress == null || contractAddress.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Blockchain contract address is not configured. Please deploy the smart contract first.");
        }
        if (credentials == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Blockchain credentials (private key) are not configured.");
        }

        try {
            // Function ABI encoding: issueCredential(string,string,string,uint256)
            Function function = new Function(
                    "issueCredential",
                    Arrays.asList(
                            new Utf8String(credentialId),
                            new Utf8String(credentialHash),
                            new Utf8String(issuer),
                            new Uint256(BigInteger.valueOf(timestamp))
                    ),
                    Collections.emptyList()
            );
            String encodedFunction = FunctionEncoder.encode(function);

            // Fetch gas price and chain ID
            BigInteger gasPrice;
            try {
                gasPrice = web3j.ethGasPrice().send().getGasPrice();
            } catch (Exception e) {
                gasPrice = BigInteger.valueOf(20_000_000_000L); // 20 Gwei fallback
            }
            BigInteger gasLimit = BigInteger.valueOf(300_000L);

            // Local Hardhat default chainId: 31337
            long chainId = 31337;
            try {
                chainId = web3j.ethChainId().send().getChainId().longValue();
            } catch (Exception ignored) {
            }

            TransactionManager txManager = new RawTransactionManager(web3j, credentials, chainId);
            EthSendTransaction sendTx = txManager.sendTransaction(
                    gasPrice,
                    gasLimit,
                    contractAddress,
                    encodedFunction,
                    BigInteger.ZERO
            );

            if (sendTx.hasError()) {
                String errorMsg = sendTx.getError().getMessage();
                log.error("Blockchain transaction error: {}", errorMsg);
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Blockchain issuance transaction failed: " + errorMsg);
            }

            String txHash = sendTx.getTransactionHash();
            log.info("Submitted credential transaction on-chain. TxHash: {}", txHash);

            // Wait for receipt
            TransactionReceiptProcessor receiptProcessor =
                    new PollingTransactionReceiptProcessor(web3j, 1000, 15);
            TransactionReceipt receipt = receiptProcessor.waitForTransactionReceipt(txHash);

            if (!receipt.isStatusOK()) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Blockchain transaction reverted on-chain (status 0). Check contract requirements.");
            }

            log.info("Credential {} mined successfully in block {} with tx {}",
                    credentialId, receipt.getBlockNumber(), txHash);
            return txHash;

        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to communicate with blockchain JSON-RPC node at {}: {}", rpcUrl, e.getMessage(), e);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Failed to communicate with blockchain node at " + rpcUrl + ": " + e.getMessage());
        }
    }

    /**
     * Reads on-chain credential state by calling verifyCredential(credentialId) via eth_call (no gas needed).
     *
     * @param credentialId Unique platform identifier
     * @return OnChainRecord tuple containing exists, hash, issuer, timestamp
     */
    public OnChainRecord verifyCredentialOnChain(String credentialId) {
        if (contractAddress == null || contractAddress.isBlank()) {
            log.warn("Contract address not configured; returning not found for verification");
            return new OnChainRecord(false, "", "", null, contractAddress, network);
        }

        try {
            Function function = new Function(
                    "verifyCredential",
                    Collections.singletonList(new Utf8String(credentialId)),
                    Arrays.asList(
                            new TypeReference<Bool>() {},
                            new TypeReference<Utf8String>() {},
                            new TypeReference<Utf8String>() {},
                            new TypeReference<Uint256>() {}
                    )
            );
            String encodedFunction = FunctionEncoder.encode(function);

            EthCall response = web3j.ethCall(
                    Transaction.createEthCallTransaction(null, contractAddress, encodedFunction),
                    DefaultBlockParameterName.LATEST
            ).send();

            if (response.hasError() || response.getValue() == null || "0x".equals(response.getValue())) {
                log.warn("eth_call for credentialId {} returned empty/error: {}",
                        credentialId, response.getError() != null ? response.getError().getMessage() : "null");
                return new OnChainRecord(false, "", "", null, contractAddress, network);
            }

            List<Type> results = FunctionReturnDecoder.decode(response.getValue(), function.getOutputParameters());
            if (results == null || results.size() < 4) {
                return new OnChainRecord(false, "", "", null, contractAddress, network);
            }

            boolean exists = (Boolean) results.get(0).getValue();
            String credentialHash = (String) results.get(1).getValue();
            String issuer = (String) results.get(2).getValue();
            BigInteger timestampSec = (BigInteger) results.get(3).getValue();
            Instant timestamp = (timestampSec != null && timestampSec.longValue() > 0)
                    ? Instant.ofEpochSecond(timestampSec.longValue())
                    : null;

            return new OnChainRecord(exists, credentialHash, issuer, timestamp, contractAddress, network);

        } catch (Exception e) {
            log.warn("Failed to query blockchain node at {} for credentialId {}: {}",
                    rpcUrl, credentialId, e.getMessage());
            // Return exists=false so caller can gracefully handle network absence during public verification
            return new OnChainRecord(false, "", "", null, contractAddress, network);
        }
    }

    public String getRpcUrl() {
        return rpcUrl;
    }

    public String getContractAddress() {
        return contractAddress;
    }

    public String getNetwork() {
        return network;
    }
}
