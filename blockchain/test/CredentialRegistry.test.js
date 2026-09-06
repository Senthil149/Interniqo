const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CredentialRegistry", function () {
  let registry;
  let owner;
  let otherAccount;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();
    const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
    registry = await CredentialRegistry.deploy();
    await registry.waitForDeployment();
  });

  it("should deploy with a valid address", async function () {
    const address = await registry.getAddress();
    expect(address).to.be.properAddress;
  });

  it("should successfully issue a credential and emit CredentialIssued event", async function () {
    const credentialId = "CRED-TEST-001";
    const credentialHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const issuer = "Acme Corp";
    const timestamp = Math.floor(Date.now() / 1000);

    await expect(registry.issueCredential(credentialId, credentialHash, issuer, timestamp))
      .to.emit(registry, "CredentialIssued")
      .withArgs(credentialId, credentialHash, issuer, timestamp);

    const [exists, hash, storedIssuer, storedTimestamp] = await registry.verifyCredential(credentialId);
    expect(exists).to.be.true;
    expect(hash).to.equal(credentialHash);
    expect(storedIssuer).to.equal(issuer);
    expect(storedTimestamp).to.equal(timestamp);
  });

  it("should reject duplicate credential issuance for the same credentialId", async function () {
    const credentialId = "CRED-TEST-DUPE";
    const credentialHash = "abc123hash";
    const issuer = "Beta Inc";
    const timestamp = Math.floor(Date.now() / 1000);

    await registry.issueCredential(credentialId, credentialHash, issuer, timestamp);

    await expect(
      registry.issueCredential(credentialId, "newhash", issuer, timestamp)
    ).to.be.revertedWith("Credential already exists");
  });

  it("should reject empty credentialId or empty credentialHash", async function () {
    const timestamp = Math.floor(Date.now() / 1000);

    await expect(
      registry.issueCredential("", "somehash", "Issuer", timestamp)
    ).to.be.revertedWith("Credential ID cannot be empty");

    await expect(
      registry.issueCredential("CRED-VALID", "", "Issuer", timestamp)
    ).to.be.revertedWith("Credential hash cannot be empty");
  });

  it("should return exists = false for non-existent credentials", async function () {
    const [exists, hash, issuer, timestamp] = await registry.verifyCredential("CRED-NOT-FOUND");
    expect(exists).to.be.false;
    expect(hash).to.equal("");
    expect(issuer).to.equal("");
    expect(timestamp).to.equal(0n);
  });
});
