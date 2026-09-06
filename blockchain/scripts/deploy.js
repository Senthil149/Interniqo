/**
 * Hardhat deployment script for CredentialRegistry.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network localhost
 *
 * NOTE FOR REAL NETWORK DEPLOYMENT:
 * 1. Network configuration: Add target network (e.g. sepolia, polygonAmoy) to hardhat.config.js
 *    with RPC URL from Infura/Alchemy and deployer private key loaded via process.env.
 * 2. Gas settings: Configure maxFeePerGas and maxPriorityFeePerGas if deploying to EIP-1559 networks.
 * 3. Contract verification: After deployment, run `npx hardhat verify --network <net> <address>`.
 * 4. Key safety: Never hardcode deployment private keys in plain text.
 */
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(`Deploying CredentialRegistry to network: ${network.name} (chainId: ${network.config.chainId})...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);

  const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
  const registry = await CredentialRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log(`CredentialRegistry successfully deployed at: ${contractAddress}`);

  // Export deployment metadata for Spring Boot / clients
  const artifactPath = path.join(__dirname, "../artifacts/contracts/CredentialRegistry.sol/CredentialRegistry.json");
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  }

  const deploymentInfo = {
    contractAddress,
    network: network.name,
    chainId: network.config.chainId || 31337,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi,
  };

  const outputPath = path.join(__dirname, "../deployed-contract.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment metadata written to: ${outputPath}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
