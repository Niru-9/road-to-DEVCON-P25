# The Chai-Stall Terminal

> Play-token prediction markets for a college forecasting club. See what's open, see what you hold, and claim your wins — all without needing a block explorer. Play tokens only. No real money on any chain.

Built for **Road to Devcon 9 — The Chai-Stall Terminal**.

## The Problem

College forecasting clubs often run informal predictions in chats or spreadsheets, making it hard to track stakes, payouts, and who won — especially in low-bandwidth settings. The Chai-Stall Terminal gives the club a single, mobile-first screen to run play-token markets on-chain with clear, verifiable accounting.

## What It Does

- **Open markets** — Browse live prediction markets read directly from the smart contract (question, close time, YES/NO pools).
- **Free play tokens** — Claim a one-time faucet of 100 CHAI per member.
- **One-tap betting** — Back YES or NO with play tokens; transaction lifecycle is shown step by step (confirm in wallet → waiting for receipt → confirmed).
- **My positions** — See every bet you've made, totals per market, and results (WON with exact payout/profit or LOST). Positions are derived from a single address-indexed event query.
- **Claim winnings** — Claim proportional payouts when a market is resolved; the claim button only appears for resolved markets where you won and haven't claimed. Success is only shown after a mined transaction receipt.
- **Network safety** — App defaults to the correct chain, disables writes on the wrong network, and prompts to switch. Works on Ethereum Sepolia (live) with Base Sepolia supported if configured.
- **Offline-friendly UX** — Skeletons, visible error + Retry on reads, small block ranges, no heavy assets.

## How Users Interact

1. **Connect** — Connect a wallet (e.g., MetaMask). The app never asks for a seed phrase or private key.
2. **Get tokens** — Use the faucet to claim 100 CHAI once per address.
3. **Bet** — Pick an open market and bet YES or NO. Confirm the transaction in your wallet.
4. **Track** — Go to "My positions" to see stakes, results, and whether winnings are claimable.
5. **Claim** — When resolved and won, claim your proportional payout in one tap.

## Architecture & Tech Stack

- **Frontend**: Vite + React 18 + TypeScript, wagmi 2.x, viem 2.x, TanStack Query 5, vitest
- **Smart Contract**: Solidity 0.8.24, Hardhat (compile/deploy scripts)
- **Networks**: Ethereum Sepolia (11155111) — deployed & live; Base Sepolia (84532) — supported (optional deploy)

## Smart Contract Details

- **Contract name**: `ChaiPredictionMarket` (play-token prediction markets, internal ledger; no ERC-20, no approvals)
- **Network (deployed)**: Ethereum Sepolia (chain ID 11155111)
- **Deployed contract address**: `0x8B3aB9B521d271bAc4f60F18393a723e21976308`
- **Deploy block**: `11939154` (used for the positions `getLogs` query)
- **Admin (organizer)**: `0x0d3477209913afFAF06CDe63Dd0F13f4C5728135` (verified on-chain)
- **Key features**: `faucet()` (100 CHAI once per address), `createMarket(question, closesAt)`, `placeBet(marketId, side, amount)`, `resolveMarket(marketId, winningSide)`, `claim(marketId)`, indexed `BetPlaced(user, marketId, ...)` event for efficient position lookup
- **Source**: [`contract/contracts/ChaiPredictionMarket.sol`](contract/contracts/ChaiPredictionMarket.sol)

## Wallet Address

**TODO:** If the project needs a specific receiving/treasury or submission wallet address, please verify and add it here. The repository code does not expose an additional project wallet beyond the deployed contract and on-chain admin. Do not publish private keys or mnemonics.

## Local Setup & Run

### Prerequisites
- Node.js 18+ and npm
- MetaMask (or compatible wallet) with Sepolia ETH (for testnet transactions)

### Setup

1. Install dependencies:
```sh
cd contract && npm install
cd ../frontend && npm install
```

2. Configure environment variables (see below). Example env files are provided: [`contract/.env.example`](contract/.env.example) and [`frontend/.env.example`](frontend/.env.example).

3. Run the frontend (dev):
```sh
cd frontend
npm run dev
```
App runs at http://localhost:5173. You can also access via your LAN IP on mobile (same Wi-Fi).

## Required Environment Variables

### Contract (`contract/.env`)
| Variable | Purpose | Required |
|---|---|---|
| `DEPLOYER_PRIVATE_KEY` | Testnet deployer key (throwaway). **Never commit**. | Only for deploy |
| `SEPOLIA_RPC_URL` | RPC for Sepolia (optional; public RPC used if empty) | Optional |
| `BASE_SEPOLIA_RPC_URL` | RPC for Base Sepolia (optional) | Optional |

See [`contract/.env.example`](contract/.env.example).

### Frontend (`frontend/.env.local`)
| Variable | Purpose | Required |
|---|---|---|
| `VITE_CONTRACT_ADDRESS_SEPOLIA` | Deployed contract on Ethereum Sepolia | Required for Sepolia |
| `VITE_DEPLOY_BLOCK_SEPOLIA` | Deploy block for log queries | Recommended |
| `VITE_CONTRACT_ADDRESS_BASE_SEPOLIA` | Contract on Base Sepolia (optional) | Optional |
| `VITE_DEPLOY_BLOCK_BASE_SEPOLIA` | Deploy block for Base Sepolia | Optional |

See [`frontend/.env.example`](frontend/.env.example). Note: the app's [`frontend/.env.local`](frontend/.env.local) contains the live Sepolia address and deploy block; this file is gitignored and not committed.

## Build, Test & Deployment

### Build frontend
```sh
cd frontend
npm run build  # runs tsc --noEmit && vite build; output in frontend/dist/
```

### Preview build
```sh
cd frontend
npm run preview
```

### Run tests (frontend)
```sh
cd frontend
npm test  # vitest run
```

### Compile & deploy contract (Hardhat)
```sh
cd contract
npm run compile  # hardhat compile
npm run deploy:sepolia      # compile + deploy to Sepolia
npm run deploy:baseSepolia  # compile + deploy to Base Sepolia
```

Deploy scripts print the exact `VITE_*` values to paste into `frontend/.env.local`. The deployer key must be set in `contract/.env` (testnet only, never commit). For manual deploys, use Remix (Solidity 0.8.24); if re-adding to Remix "At Address", recompile the same source first so the ABI is loaded.

## Demo & Live Links

**TODO:** Add demo/live app URL if deployed (e.g., GitHub Pages, Vercel, Netlify). Not found in repo files.

## License & Credits

This project is licensed under the [MIT License](LICENSE) (see [`LICENSE`](LICENSE)).

- Built for **Road to Devcon 9 — The Chai-Stall Terminal** (Loops House, Prediction Markets).
- UI/UX and implementation focus on correctness (bigint math for amounts, address-indexed event queries, receipt-gated success, chain guards).
