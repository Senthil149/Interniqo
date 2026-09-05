/**
 * Confirms the local Hardhat JSON-RPC endpoint is reachable.
 * Start the node first: npm run node
 */
const { JsonRpcProvider } = require("ethers");

async function main() {
  const url = process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545";
  const provider = new JsonRpcProvider(url);
  const network = await provider.getNetwork();
  const blockNumber = await provider.getBlockNumber();
  console.log(
    JSON.stringify({
      service: "blockchain",
      status: "ok",
      chainId: Number(network.chainId),
      blockNumber,
      rpc: url,
    })
  );
}

main().catch((error) => {
  console.error(JSON.stringify({ service: "blockchain", status: "error", message: error.message }));
  process.exit(1);
});
