// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CredentialRegistry
 * @dev Minimal smart contract for issuing and verifying academic & internship credentials.
 * Implements Phase 11 project specifications:
 *   - issueCredential(credentialId, credentialHash, issuer, timestamp)
 *   - verifyCredential(credentialId)
 *
 * NOTE FOR REAL NETWORK DEPLOYMENT:
 * 1. Access Control: In production, consider adding OpenZeppelin AccessControl or Ownable2Step
 *    to restrict issueCredential callers to verified institutional issuer wallet addresses.
 * 2. Gas Optimization: Replace string keys with bytes32 (e.g. keccak256 hashes) if throughput
 *    or storage footprint needs optimization on Ethereum mainnet or L2s.
 * 3. Event Indexing: Indexed parameters allow efficient off-chain event log filtering and auditing.
 * 4. Upgradability: Consider using ERC-1967 Transparent or UUPS proxy patterns if the registry
 *    data schema needs future evolution.
 * 5. Standards: Consider adopting ERC-4973 / ERC-5484 Account-Bound (Soulbound) Tokens if
 *    direct wallet minting to student addresses is desired.
 */
contract CredentialRegistry {

    struct CredentialRecord {
        string credentialId;
        string credentialHash;
        string issuer;
        uint256 timestamp;
        bool exists;
    }

    // Mapping from unique credentialId string to stored on-chain record
    mapping(string => CredentialRecord) private _credentials;

    // Events for transparent auditability and indexing
    event CredentialIssued(
        string indexed credentialId,
        string credentialHash,
        string issuer,
        uint256 timestamp
    );

    /**
     * @notice Issue a new credential hash on-chain.
     * @param credentialId Unique platform identifier for the credential (e.g. CRED-...)
     * @param credentialHash SHA-256 canonical hash of the credential fields
     * @param issuer The entity or company issuing the credential
     * @param timestamp Unix epoch timestamp of credential issuance
     */
    function issueCredential(
        string calldata credentialId,
        string calldata credentialHash,
        string calldata issuer,
        uint256 timestamp
    ) external {
        require(bytes(credentialId).length > 0, "Credential ID cannot be empty");
        require(bytes(credentialHash).length > 0, "Credential hash cannot be empty");
        require(!_credentials[credentialId].exists, "Credential already exists");

        _credentials[credentialId] = CredentialRecord({
            credentialId: credentialId,
            credentialHash: credentialHash,
            issuer: issuer,
            timestamp: timestamp,
            exists: true
        });

        emit CredentialIssued(credentialId, credentialHash, issuer, timestamp);
    }

    /**
     * @notice Verify a credential on-chain by credentialId.
     * @param credentialId Platform identifier of the credential to verify
     * @return exists Whether the credential was found in registry
     * @return credentialHash The stored hash
     * @return issuer The issuer name/identifier
     * @return timestamp The unix timestamp recorded during issuance
     */
    function verifyCredential(
        string calldata credentialId
    ) external view returns (
        bool exists,
        string memory credentialHash,
        string memory issuer,
        uint256 timestamp
    ) {
        CredentialRecord memory rec = _credentials[credentialId];
        return (rec.exists, rec.credentialHash, rec.issuer, rec.timestamp);
    }
}
