/**
 * Deploys ChaiPredictionMarket and seeds the club's starter markets.
 * Uses standalone viem against the artifact Hardhat compiles — no wallet plugin needed.
 *
 * Usage:
 *   npm run deploy:sepolia
 *   npm run deploy:baseSepolia
 */
import { readFileSync } from "node:fs";
import { createPublicClient, createWalletClient, http, defineChain, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import "dotenv/config";

const NETWORKS = {
  sepolia: defineChain({
    id: 11155111,
    name: "sepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"] } },
    testnet: true,
  }),
  baseSepolia: defineChain({
    id: 84532,
    name: "baseSepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [process.env.BASE_SEPOLIA_RPC_URL || "https://base-sepolia-rpc.publicnode.com"] } },
    testnet: true,
  }),
};

const SEED_MARKETS = [
  ["Will the monsoon onset hit Kerala before 1 June?", 14], // days from deployment
  ["RBI: repo rate unchanged at the next policy decision?", 21],
  ["Will the canteen get a second coffee machine this semester?", 30],
];

const networkName = process.argv[2];
const chain = NETWORKS[networkName];
if (!chain) {
  console.error(`Unknown network "${networkName}". Use: sepolia | baseSepolia`);
  process.exit(1);
}
if (!process.env.DEPLOYER_PRIVATE_KEY) {
  console.error("DEPLOYER_PRIVATE_KEY missing — copy contract/.env.example to contract/.env and fill it.");
  process.exit(1);
}

const artifact = JSON.parse(
  readFileSync("artifacts/contracts/ChaiPredictionMarket.sol/ChaiPredictionMarket.json", "utf8"),
);
const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);
const publicClient = createPublicClient({ chain });
const walletClient = createWalletClient({ account, chain });

const balance = await publicClient.getBalance({ address: account.address });
console.log(`Network: ${chain.name} (chainId ${chain.id})`);
console.log(`Deployer: ${account.address} (balance: ${formatEther(balance)} ETH)`);
if (balance === 0n) {
  console.error("Deployer has no gas on this chain — fund the address from a testnet faucet first.");
  process.exit(1);
}

const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
  args: [],
});
const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== "success") {
  console.error("Deployment transaction reverted.");
  process.exit(1);
}
if (!receipt.contractAddress) {
  console.error("No contract address in receipt — unexpected.");
  process.exit(1);
}
console.log(`ChaiPredictionMarket deployed: ${receipt.contractAddress}`);
console.log(`Deploy tx: ${receipt.transactionHash}`);
console.log(`Deploy block: ${receipt.blockNumber}`);

for (const [question, daysFromNow] of SEED_MARKETS) {
  const closesAt = BigInt(Math.floor(Date.now() / 1000) + daysFromNow * 24 * 3600);
  const txHash = await walletClient.writeContract({
    address: receipt.contractAddress,
    abi: artifact.abi,
    functionName: "createMarket",
    args: [question, closesAt],
  });
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`Seeded market: ${question}`);
}

const envKey = networkName === "baseSepolia" ? "BASE_SEPOLIA" : "SEPOLIA";
console.log("\n--- Copy into frontend/.env.local ---");
console.log(`VITE_CONTRACT_ADDRESS_${envKey}=${receipt.contractAddress}`);
console.log(`VITE_DEPLOY_BLOCK_${envKey}=${receipt.blockNumber}`);
