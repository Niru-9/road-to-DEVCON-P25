# PLAN.md — Chai-Stall Terminal: 5-Hour MVP

**Goal:** a public repo with a mobile-first web app where a club member opens the app on a
budget Android phone over flaky hostel Wi-Fi, sees open markets, sees their positions, and
claims a win — no block explorer. Play tokens only.

**Score target:** 80/80 on the 9 code-read checks + 20 judgment (polish, README, code clarity).

---

## Stack (locked — don't churn)

- **Vite + React** (not Next.js — static build, fewer moving parts, faster to ship in 5h)
- **wagmi v2 + viem** (Base Sepolia via `baseSepolia` chain constant)
- **TanStack Query v5** (wagmi's `useReadContract`/`useReadContracts` already sits on it)
- **No CSS framework needed** — one small CSS file, mobile-first, large tap targets

## Non-negotiables (these ARE the test cases)

| Check | Pts | How the plan satisfies it |
|-------|-----|---------------------------|
| 1 Markets from contract | 5 | `useReadContract`/`useReadContracts` against env-configured `VITE_CONTRACT_ADDRESS` + imported ABI. Zero hardcoded market data. |
| 2 Positions for connected wallet | 5 | Positions view keyed to `useAccount().address`. |
| 3 No float arithmetic | 14 | One helper module `format.ts`: `formatUnits(v, decimals)` for display; P&L computed in `bigint` first. No `Number()`, `parseFloat`, `/1e18` anywhere. |
| 4 Positions filtered by address | 14 | `useReadContracts`/`getLogs` with **indexed `user` argument** on the position event (or one `positions(user)` read). **Never** loop market IDs. |
| 5 Chain guard on writes | 10 | `chainId` arg on `writeContract` + disabled claim button + "Switch to Base Sepolia" prompt when `useChainId() !== baseSepolia.id`. |
| 6 Success after receipt | 14 | Success UI keyed on `useWaitForTransactionReceipt({ hash })` with `receipt.status === 'success'`. Never on `writeContract` resolving. |
| 7 Claim gated on resolved | 7 | Claim button rendered only when the **chain read** says `market.resolved === true`. |
| 8 Read error states | 6 | Every read hook renders `isError → message + Retry (refetch)` branch. No bare spinners. |
| 9 No credentials tracked | 5 | `.env.example` with `VITE_CONTRACT_ADDRESS=` placeholder only; no RPC keys needed (public Base Sepolia RPC); `.env` gitignored. |

---

## Hour-by-hour

### ⏱ Hour 0:00–0:30 — Ground truth (contract, ABI, harness)

1. `node -v` (✅ v24 already), then run `npx loopshouse add road-to-devcon-ix` in `N:\lop1`.
2. Pull the reference contract **address + ABI** from the event page / knowledge graph:
   `loops knowledge query --event road-to-devcon-ix --problem chai-stall-terminal -q "reference contract address and ABI"`.
3. **Read the ABI before writing any UI.** Note exactly:
   - how markets are listed (`getMarkets()` / `marketCount()` + `market(id)` / a `MarketCreated` event)
   - the market struct fields (esp. `resolved` boolean, outcome, close time, token decimals)
   - the **position/bet event with an indexed user field**, or a `positions(user)` view fn
   - the claim function name (`claim(...)` / `claimWinnings(...)`)
4. Save ABI to `src/abi/referenceAbi.ts` (JSON import) and address to `.env.example`.

**Decision gate:** if the ABI has *no* address-keyed position read *and* no indexed-user
event → fall back to the allowed alternative in check 4 wording ("one contract read keyed
by the user"), e.g. a mapping getter. Only as a last resort, never per-market iteration.

### ⏱ Hour 0:30–1:15 — Scaffold + read path (checks 1, 8)

1. `npm create vite@latest . -- --template react-ts`; install `wagmi viem @tanstack/react-query`.
2. Wagmi config: `baseSepolia` chain, `http()` transport (public RPC), QueryClient provider.
3. `src/lib/format.ts`:
   - `formatAmount(v: bigint): string` → `formatUnits(v, DECIMALS)`
   - `pnl(staked: bigint, won: bigint): bigint` → bigint math, format **after**
4. **Markets screen:** read market list from contract → render cards: question, status
   OPEN/RESOLVED (from chain field), pool totals formatted via `formatAmount`.
   Each read hook gets `isError` → visible message + **Retry** button. ← check 8 done here.
5. Skeleton loaders (not endless spinners) for the bad-Wi-Fi case.

### ⏱ Hour 1:15–2:15 — Wallet + positions (checks 2, 4)

1. `useConnect`/`useAccount`/`useConnectors` — injected (MetaMask etc.) is enough; keep
   the connect button huge and sticky for phones.
2. **Positions query keyed by address:** one call filtered by `args: { user: address }`
   on the position event (`useReadContracts` or a single `readContract` getter).
   Explicitly **no** market-ID loop — add a code comment saying so (graders read code).
3. Per position row: market question, side, staked amount, **winnings computed in
   bigint** (`wonAmount - stakedAmount` before formatting), WON/LOST/OPEN badge from chain data.
4. Unconnected state → prompt to connect (not an empty table).

### ⏱ Hour 2:15–3:30 — Claim write flow (checks 5, 6, 7) ← the 41-point cluster

Order matters; build in this exact sequence:

1. **Gate (7):** claim button only rendered when that market's chain read shows
   `resolved === true`. No client-side date logic anywhere.
2. **Chain guard (5):**
   - `const wrongChain = useChainId() !== baseSepolia.id`
   - wrong chain → button disabled + "Switch to Base Sepolia" calling `switchChain`
   - ALSO pass `chainId: baseSepolia.id` in `writeContract` (belt and suspenders — the
     check accepts any of the three; we show all).
3. **Write → receipt (6):** `useWriteContract` → on hash, `useWaitForTransactionReceipt`
   → success panel only when `isSuccess && receipt.status === 'success'`; pending state =
   "Waiting for confirmation…"; `status === 'reverted'` → visible failure + retry.
   Invalidate positions query on success so the row updates.
4. Handle "already claimed" revert message gracefully.

### ⏱ Hour 3:30–4:30 — Mobile/bad-network hardening + UX (judgment points)

1. Mobile-first pass: single column, ≥44px tap targets, sticky connect/claim bar,
   works at 360px width, no horizontal scroll.
2. Flaky Wi-Fi: TanStack Query `retry: 2`, `staleTime` tuned, offline/`isError` banner
   with Retry, optimistic-free (never claim success before receipt).
3. Small delight: pull-to-refresh friendly layout, resolved markets show ✅/❌ with the
   actual won amount in chai-sized numbers.
4. Lighthouse-ish sanity: keep bundle small (no extra UI libs).

### ⏱ Hour 4:30–5:00 — Ship (deliverable + self-audit)

1. **README:** what it is, prerequisites, `npm i && npm run dev`, env vars table
   (`VITE_CONTRACT_ADDRESS` placeholder), how to run against the reference contract,
   Base Sepolia faucet note, screenshots.
2. `.gitignore` excludes `.env`; `git grep` for `0x`-private-keys / RPC URLs with keys →
   confirm nothing tracked (check 9).
3. **Walk the 9 checks one by one against the actual source** (grep for forbidden
   patterns: `Number(`, `parseFloat`, `1e18`, `10 **`, `toFixed` on amounts).
4. `npm run build` clean; push **public** GitHub repo.

---

## Risk register

| Risk | Mitigation |
|------|-----------|
| ABI shape unknown until Hour 0 | Timebox ABI reading to 30 min; every later component depends on it. |
| Positions event has no indexed user | Use the "one contract read keyed by the user" alternative the check explicitly allows. |
| Public Base Sepolia RPC flaky | Transport falls back to a second public RPC URL (no key, not a credential). |
| Receipt takes long on Sepolia | Show pending state keyed to receipt hash; success **only** on receipt — this is worth 14 pts, do not shortcut. |
| Time overrun | Cut scope in this order: fancy styling → resolved-market detail view → keep: read path, positions-by-address, claim flow, error states. Checks 1–9 are never cut. |

## Definition of done (5:00)

- [ ] All 9 checks pass on a manual read-through of the repo
- [ ] Claim flow demo: wrong chain blocked → switch → claim → receipt success shown
- [ ] Positions render for connected address with bigint-computed P&L
- [ ] Error + Retry visible for a deliberately broken RPC
- [ ] Public repo + README with reference-contract run instructions
