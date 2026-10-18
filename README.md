# Chai-Stall Terminal

> One screen for Meera's forecasting club — see what's open, see what you hold, claim your wins.
> **Play tokens only. Nothing here touches real money on any chain.**

Built for **Road to Devcon 9 — Prediction Markets** ([The Chai-Stall Terminal](https://www.loops.house/road-to-devcon-ix)).

## What it does

Thirty club members trade play-token markets on a prediction-market contract. Until now the
only interface was a block explorer. This app gives the club:

- **Open markets** read live from the contract (question, YES/NO pools, close time)
- **One-tap betting** with free play tokens from an in-contract faucet
- **My positions** — derived from a single address-indexed event query, not a market scan
- **Win/loss accounting** with exact bigint math (no float rounding, the "decimal in the
  wrong place" bug from the brief can't happen here)
- **Claim winnings**, gated on the market's on-chain resolved state, with success shown only
  after a mined receipt
- **Bad-Wi-Fi resilience** — skeletons instead of endless spinners, visible error + Retry on
  every chain read, tiny block ranges, no heavy assets

## Run it

```sh
cd frontend
npm install
cp .env.example .env.local   # fill in the contract address + deploy block (see below)
npm run dev                  # http://localhost:5173
```

Open it on your phone by visiting your machine's LAN IP from the same Wi-Fi, or deploy the
static build anywhere (`npm run build` → `frontend/dist/`).

### Environment (`frontend/.env.local`)

| Variable | Meaning |
|----------|---------|
| `VITE_CONTRACT_ADDRESS_SEPOLIA` | ChaiPredictionMarket address on Ethereum Sepolia (chain 11155111) |
| `VITE_CONTRACT_ADDRESS_BASE_SEPOLIA` | ChaiPredictionMarket address on Base Sepolia (chain 84532) |
| `VITE_DEPLOY_BLOCK_SEPOLIA` | Block the contract was deployed at (keeps the positions log query fast) |
| `VITE_DEPLOY_BLOCK_BASE_SEPOLIA` | Same, for Base Sepolia |

The header switches between Base Sepolia and Sepolia. Base Sepolia is the default target
whenever it has a configured address, and the write path compares the wallet's chain against
it before any transaction is sent (wrong network → buttons disabled + one-tap switch prompt).

### The contract

`contract/ChaiPredictionMarket.sol` — markets with YES/NO pools, a one-time free faucet of
play tokens, proportional winner payouts, all internal-ledger (no ERC-20, no approvals).
Deploy it from [Remix](https://remix.ethereum.org) (compiler **0.8.24**) or:

```sh
cd contract
npm install
cp .env.example .env        # add a funded throwaway deployer key (never commit .env)
npm run deploy:sepolia      # or: npm run deploy:baseSepolia
```

The deploy script prints the exact `VITE_*` lines to paste into `frontend/.env.local`.

## How it works (for club members)

1. **Connect wallet** (MetaMask) — the app never asks for a seed phrase, only a signature to bet.
2. **Get free play tokens** — one faucet claim of 100 CHAI per member.
3. **Open markets** — bet YES or NO with any amount; the transaction lifecycle is shown
   step by step: confirm in wallet → waiting for receipt → confirmed on-chain (with an
   explorer link so you can watch the tx, but you never *need* the explorer).
4. **My positions** — every bet you've made, your totals per market, and once the organizer
   resolves a market: **WON** with the exact payout and profit, or **LOST**.
5. **Claim winnings** — one button, only on resolved markets you've won, only on the right
   network, and "success" means a mined receipt with `status: success`. Nothing less.

## Engineering notes (how the acceptance checks map)

- **Reads**: `marketCount` + batched `getMarket(id)` via `useReadContract`/`useReadContracts`
  against the env-configured address. No market data is hardcoded anywhere.
- **Positions**: `getLogs({ event: BetPlaced, args: { user } })` — the `user` field is an
  **indexed event parameter**, so one filtered query returns everything a member holds. The
  app never loops market ids to find a user's bets.
- **No floats on amounts**: every base-unit value is displayed through `formatUnits`
  (`src/lib/format.ts`), and P&L / payout arithmetic is done in `bigint` **before** any
  formatting. `Number()`/`parseFloat` never touch a token amount.
- **Chain guard**: `useTx` compares the wallet's chain id against the app's target chain
  (Base Sepolia by default), disables write controls, offers a switch prompt, and passes
  `chainId` to `writeContract` so a write can't land on another network.
- **Receipt-gated success**: success UI is conditioned on `useWaitForTransactionReceipt`
  returning `status === "success"`. A returned hash or a resolved write is only ever
  "confirming".
- **Resolved-gated claims**: the claim control renders only when the chain read shows the
  market as `resolved` (and you hold the winning side, and haven't claimed).
- **Error states**: every read hook has a visible error message + Retry — never a blank view.
- **Credentials**: `.env`/`.env.local` are gitignored; `.env.example` files carry placeholders only.

## Repo layout

```
contract/   ChaiPredictionMarket.sol + Hardhat compile + viem deploy script
frontend/   Vite + React + wagmi + viem + TanStack Query app (mobile-first)
```

## Tests

```sh
cd frontend && npm test    # bigint formatting + position aggregation (vitest)
```
