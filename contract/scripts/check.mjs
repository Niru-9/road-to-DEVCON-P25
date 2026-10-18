/** Quick post-deploy verification: code exists, admin + marketCount readable. */
import { readFileSync } from "node:fs";
import { createPublicClient, http } from "viem";

const client = createPublicClient({ transport: http("https://ethereum-sepolia-rpc.publicnode.com") });
const address = "0x8B3aB9B521d271bAc4f60F18393a723e21976308";
const abi = JSON.parse(
  readFileSync("artifacts/contracts/ChaiPredictionMarket.sol/ChaiPredictionMarket.json", "utf8"),
).abi;

const code = await client.getCode({ address });
console.log("Code at address:", code && code.length > 2 ? `✓ (${(code.length - 2) / 2} bytes)` : "✗ EMPTY");

const admin = await client.readContract({ address, abi, functionName: "admin" });
const marketCount = await client.readContract({ address, abi, functionName: "marketCount" });
console.log("Admin:", admin);
console.log("Market count:", marketCount.toString());

for (let i = 0n; i < marketCount; i++) {
  const m = await client.readContract({ address, abi, functionName: "getMarket", args: [i] });
  console.log(`Market #${i}:`, m.question, "| closesAt:", m.closesAt.toString(), "| resolved:", m.resolved);
}

// Verify the address-indexed positions query the frontend uses
const betPlaced = abi.find((e) => e.type === "event" && e.name === "BetPlaced");
const logs = await client.getLogs({
  address,
  event: betPlaced,
  args: { user: "0x0d3477209913afFAF06CDe63Dd0F13f4C5728135" },
  fromBlock: 11939154n,
  toBlock: "latest",
});
console.log(`BetPlaced logs for deployer: ${logs.length}`);
for (const log of logs) {
  console.log("  bet:", log.args.marketId.toString(), "side", log.args.side, "amount", log.args.amount.toString());
}
const bal = await client.readContract({ address, abi, functionName: "playBalance", args: ["0x0d3477209913afFAF06CDe63Dd0F13f4C5728135"] });
console.log("Deployer playBalance:", bal.toString(), "wei");
