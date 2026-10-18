# HANDOFF.md — session context for "The Chai-Stall Terminal" (Road to Devcon 9)

> Read this first in a new session. It captures everything: mission, decisions, verified state,
> the exact next steps, and every gotcha learned the hard way.

## Mission

Hackathon problem **"The Chai-Stall Terminal"** (slug `chai-stall-terminal`) for **Road to Devcon 9**
(Prediction Markets, Loops House). Build a mobile-first web app for a college forecasting club:
show open play-token markets from a contract, show a connected wallet's positions, let members
claim winnings — all without a block explorer. **Play tokens only, no real money.**

- **Submission deadline: Oct 18, 2026, 23:11 IST (TONIGHT).**
- Deliverable: public GitHub repo + README. Submission via `loops project create --repoUrl <url>`.
- Scoring: 9 code-read checks = 80 pts (details below) + 20 pts judgment.
- User (builder) is enrolled; Loops CLI authenticated as ndkindia09@gmail.com, 99 credits left,
  **no project submitted yet** (repoUrl is the only required field).

## Stack (locked)

Vite + React 18 + TypeScript, wagmi **2.19.5**, viem **2.57.7**, TanStack Query 5, vitest.
Chains: **Ethereum Sepolia (11155111) — DEPLOYED & WORKING**, Base Sepolia (84532) — app is
dual-chain ready but contract NOT deployed there (user had no Base Sepolia gas; optional).

## Deployed contract (live, verified on-chain)

- **Address: `0x8B3aB9B521d271bAc4f60F18393a723e21976308`** (Ethereum Sepolia)
- Deploy block: **11939154** (used as `fromBlock` for the positions log query)
- Admin/organizer wallet (user's MetaMask): `0x0d3477209913afFAF06CDe63Dd0F13f4C5728135`
- Deployed by the USER via **Remix + MetaMask** (their choice — abandoned Hardhat deploy path;
  Hardhat remains only for `compile`. `contract/scripts/deploy.mjs` + `check.mjs` exist as
  scripted alternatives. Throwaway deployer key in `contract/.env` — gitignored, unused.)
- Verified: code 7,644 bytes ✓, admin ✓, marketCount ✓, faucet worked end-to-end via the UI
  (user's wallet got 100 CHAI and saw it in the app balance) ✓
- To re-add in Remix after closing: Deploy&Run → "At Address" → paste address (compile the
  same .sol first so ABI is loaded).

## Contract design (`contract/ChaiPredictionMarket.sol`, solidity 0.8.24)

Internal play-token ledger (NOT ERC-20 — MetaMask token-import shows 0, that's expected and
explained to the user). 18 decimals, symbol implied "CHAI".

- `faucet()` — 100 CHAI once per address (user's admin wallet ALREADY used it)
- `createMarket(question, closesAt)` — admin only. **Append-only, no update function.**
- `placeBet(marketId, side 1=YES|2=NO, amount)` — debits playBalance, min bet 1 CHAI
- `resolveMarket(marketId, winningSide)` — admin only
- `claim(marketId)` — winners get proportional `(stake * totalPool) / winnerPool`, marks claimed
- Views: `marketCount`, `getMarket(id)` (struct: id/question/closesAt/resolved/winningSide/yesPool/noPool/createdAt),
  `playBalance(user)`, `betYes/betNo(user,id)`, `claimed(user,id)`, `faucetUsed(user)`
- **`event BetPlaced(address indexed user, uint256 indexed marketId, uint8 side, uint256 amount, uint64 timestamp)`**
  → the frontend positions query = ONE `getLogs` filtered by `args: { user }` (satisfies check 4).
- Errors revert with named custom errors; no pausable/proxy/upgradeability (not needed).

## Frontend architecture (`frontend/src/`)

- `config/wagmi.ts` — chains [baseSepolia, sepolia], injected connector, publicnode transports
- `config/env.ts` — `CONTRACT_ADDRESSES` + `DEPLOY_BLOCKS` per chain from `.env.local`;
  `defaultChainId()` → baseSepolia if it has an address, else sepolia
- `frontend/.env.local` — ALREADY WIRED: Sepolia address + block 11939154 (gitignored)
- `abi/ChaiPredictionMarket.json` — extracted from Hardhat artifact (33 entries)
- `hooks/useAppChain.tsx` — context: target chain + toggle, contract address for that chain
- `hooks/useTx.ts` — **THE single write path** (checks 5+6 live here): compares wallet chainId
  vs target chain (`wrongChain`), passes `chainId` to writeContractAsync, success =
  `useWaitForTransactionReceipt` receipt `status === "success"` ONLY
- `lib/format.ts` — `formatTokens` (formatUnits, 4-dp truncate, comma grouping), `payoutWei`,
  `pnlWei` — all bigint before formatting (check 3). Unit-tested.
- `lib/positions.ts` — pure `aggregatePositions(logs)` bigint accumulation + BET_PLACED_EVENT
- `views/MarketsView.tsx` — marketCount + batched getMarket (per-item chainId), open = !resolved
  && (closesAt==0 || now<closesAt), resolved in <details>; ErrorPanel+Retry everywhere (check 8)
- `views/PositionsView.tsx` — user-filtered getLogs → aggregate → batch getMarket/claimed;
  WON row shows payout+profit (bigint) + ClaimButton **only when market.resolved** (check 7)
- `components/` — ChainBanner (switch prompt), BalanceCard (balance + faucet), MarketCard
  (bet YES/NO + TxStatusStrip lifecycle), ConnectButton, ErrorPanel
- Mobile-first CSS (`styles.css`), chai-warm theme, ≥44px targets, prefers-reduced-motion

## The 9 checks — how each is satisfied (80 pts)

1. Markets from contract reads → `useReadContract(marketCount)` + `useReadContracts(getMarket)` — NO hardcoded data
2. Positions for connected wallet → PositionsView keyed to `useAccount().address`
3. No float arithmetic → `formatTokens` = formatUnits; payout/P&L bigint in `payoutWei`/`pnlWei`; no Number()/parseFloat on amounts anywhere (only market COUNT and timestamps use Number(), each commented)
4. Positions by user filter → `getLogs({ event: BetPlaced, args: { user } })`, one indexed-address query, fromBlock=deploy block — never per-market iteration
5. Chain guard → `useTx`: wrongChain disable + ChainBanner switch prompt + chainId on write; default target = Base Sepolia when deployed there
6. Receipt-gated success → TxStatusStrip success only on receipt.status==="success"; reverted shows error + retry
7. Claim gated on resolved → ClaimButton rendered only when chain-read `market.resolved && stakeOnWinning>0 && !claimed`
8. Error states → ErrorPanel (visible msg + Retry) on every read: count, batch, logs, balance
9. No credentials tracked → `.env`/`.env.local` gitignored; only `.env.example` placeholders tracked (verified with git ls-files)

## Verified working (evidence)

- `npx hardhat compile` ✓; `cd frontend && npm run build` (tsc --noEmit + vite) ✓
- `cd frontend && npm test` → **10/10 vitest** (formatting, payout math mirrors contract, aggregation)
- Live browser test (Review pane tab @ localhost:5173): unconnected → reads Sepolia →
  correct empty state, **0 console errors**; user connected wallet → faucet → 100 CHAI shown ✓
- **BUG FOUND & FIXED**: wagmi sends reads to the FIRST configured chain (baseSepolia) unless
  pinned. Fix = explicit `chainId` on every read hook. NOTE: in wagmi 2.19.5 `useReadContracts`
  does NOT accept top-level `chainId` (TS error) → **chainId goes INSIDE each contract item**;
  single `useReadContract` takes top-level chainId fine. Committed (commit d34e38d).

## Git

Repo at N:\lop1, branch master, 3 commits (scaffold → chainId fix). NOT pushed anywhere yet.
No credentials tracked. Dev server was started with `cd frontend && npm run dev` (background).

## ⚠️ Gotchas (learned the hard way — don't rediscover)

- The agent CANNOT view images in this session (no image input) — ask user to paste text instead.
- Browser screenshot tool needs the Review pane/tab visibly focused; use `browser.snapshot`
  (accessibility tree) for verification instead — it always works.
- No `setTimeout` inside Code Mode `execute` blocks.
- formatTokens order: slice(0,4) THEN trim trailing zeros (not reverse).
- Contract has no market-update function — bad markets are permanent; they're invisible in the
  app (not open, not resolved), so just create fresh ones.
- USER-DEPLOYED MARKETS ARE CURRENTLY GIBBERISH: user seeded with question "aaa"/"ewfkekmf"/
  "sfsmslgmksm" and closesAt=20 (typed test values). marketCount=3, all junk, all hidden.
- Remix "At Address" re-add needs the .sol recompiled in-session first (ABI in memory).

## ▶️ NEXT STEPS (in order)

1. **User re-seeds 3 correct markets** via Remix (instructions already given, awaiting "done"):
   `createMarket("Will the monsoon onset hit Kerala before 1 June?", 1793510950)`,
   `createMarket("RBI: repo rate unchanged at the next policy decision?", 1794115750)`,
   `createMarket("Will the canteen get a second coffee machine this semester?", 1794893350)`
   → verify: `cd contract && node scripts/check.mjs` (expect marketCount=6, last 3 correct)
2. **Full demo walkthrough** in browser: connect → markets visible → bet YES (user's wallet has
   100 CHAI) → admin resolves market via Remix `resolveMarket(3, 1)` → positions shows WON +
   claim → claim tx → receipt → success. Verifies checks 2/5/6/7 live end-to-end.
3. **Push to GitHub** (public repo). Check `gh auth status`; if authed:
   `gh repo create chai-stall-terminal --public --source . --push`; else give user manual steps.
4. **Loops submission**: `loops project create --event road-to-devcon-ix --repoUrl <url>`
   WITHOUT `--confirm` first → show the draft to the user → `--confirm` ONLY after explicit yes.
5. `loops evaluate --event road-to-devcon-ix --problem chai-stall-terminal` → report feedback → fix agreed items.
6. Optional polish (time permitting): Base Sepolia deploy (LearnWeb3 faucet https://faucet.learnweb3.io/
   gives both chains on one GitHub login; then fill env + redeploy contract via Remix on Base),
   demo screenshot in README, code-split the 531KB bundle, resolve-panel for admin (NOT required).

## Useful commands

```sh
cd contract && node scripts/check.mjs        # on-chain state + positions-logs sanity check
cd frontend && npm run build && npm test     # typecheck + unit tests
cd frontend && npm run dev                   # dev server :5173
loops project get --event road-to-devcon-ix  # submission state
loops knowledge query --event road-to-devcon-ix --problem chai-stall-terminal -q "..."  # 1 credit each
```
