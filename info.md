# Road to Devcon 9 — Prediction Markets

## The Chai-Stall Terminal

Meera runs the forecasting club at an engineering college in Pune. Thirty members trade
play-token markets on a contract the organisers deployed to Base Sepolia: monsoon onset,
the next RBI rate decision, whether the canteen finally gets a second coffee machine. The
trouble is that the only interface is a block explorer. Nobody knows what's open, what
they hold, or whether they've won. Most members check from budget Android phones on
hostel Wi-Fi that drops every ten minutes, and last week someone announced a big win that
turned out to be a decimal in the wrong place.

She wants one screen the whole club can actually use.

**Play tokens only. Nothing in this problem touches real money on any chain.**

## What you'll learn

- Reading contract state and event logs from a frontend
- Turning base-unit integers into numbers people can read, without losing precision
- The life of a transaction, from signature to receipt
- Designing for a network that fails halfway through a page load

## What to do

1. Get the reference contract's address and ABI from the event page. Read it; don't deploy your own.
2. Show the markets that are currently open.
3. Let a member connect a wallet and see their positions, including what they won or lost on resolved markets.
4. Let them claim winnings on a market they've won.
5. Make it usable on a small phone over a bad connection.

**Deliverable.** A public GitHub repo containing the app's source and a README that explains
how to run it against the reference contract.

## Acceptance criteria

- A club member opens the app on their phone, sees what's open and what they holds, and
  claims a win without ever touching a block explorer.
- 9 scored test cases · 80 points are read straight off your code — see the Test cases tab.

## Suggested stack

- React (Next.js or Vite)
- wagmi
- viem
- TanStack Query
- Base Sepolia

---

## Test cases (9 checks — 80 points from checks, 20 from judgment)

| #  | Test case | Pts | Passes if | Fails if |
|----|-----------|-----|-----------|----------|
| 1  | Open markets are read from the reference contract | 5  | The market list is populated from on-chain reads against a configured contract address. | The market list comes from hardcoded or mock data, or no market list exists in the code. |
| 2  | The connected wallet's positions are displayed | 5  | A view renders positions derived from chain reads for the connected wallet's address. | Positions are hardcoded, not tied to the connected address, or no positions view exists. |
| 3  | No token amount is converted with floating-point arithmetic | 14 | Every base-unit amount is displayed through `formatUnits` / `formatEther` (or ethers equivalents), and any arithmetic on amounts (such as P&L) is done in `bigint` before formatting. | Any base-unit amount is converted with `Number()`, `parseFloat`, or division by `1e18` / `10**decimals`, any amount arithmetic happens on floats, or amounts are shown as raw base-unit integers. |
| 4  | Positions are queried by the user's address, not by scanning every market | 14 | Positions come from a query filtered by the connected address: an indexed-event filter, an indexer query with a user filter, or one contract read keyed by the user. | Positions are found by iterating every market ID and issuing a per-market read for the user, or no positions query exists. |
| 5  | Write actions are blocked when the wallet is on the wrong chain | 10 | Before a write is sent, the wallet's chain ID is compared with Base Sepolia (via a disabled control, a switch prompt, or a chainId argument on the write) so the write cannot go to another network. | The write can be sent regardless of the wallet's chain, or no chain comparison exists anywhere in the write path. |
| 6  | Success is shown only after a transaction receipt | 14 | The success state is conditioned on a mined receipt with a successful status. | Success is shown when the hash returns or when `writeContract` resolves, the receipt's status is never checked, or no claim write exists. |
| 7  | The claim action is gated on the market's resolved state | 7  | The claim control is rendered or enabled only when a chain read (contract state or a resolution event) shows the market as resolved. | The claim control appears for unresolved markets, is gated only on a client-side date or close time, or no claim control exists. |
| 8  | Failed chain reads render an error state | 6  | A failed market or positions read renders a visible message or retry control to the user. | Read errors are ignored or only logged, leaving a blank view or endless spinner, or no error branch exists. |
| 9  | No credential appears in any tracked file | 5  | No credential, key, or authenticated URL appears in any tracked file; example env files contain only placeholders. | Any credential, key, or authenticated URL appears in a tracked file. |

---

## Agent harness setup (Loops House)

### Before you run it

- Needs Node 20.12+ (22 LTS recommended) — check with `node -v`, and switch with `nvm use 22` if older.
- Sign-in opens in your browser (Google, GitHub, or an email code) — nothing to copy or paste.
- Run it in your project directory — it installs this battle's agent skill and signs you in,
  then you build with your own coding agent.

### How to use

**Via CLI** — query this problem's knowledge graph straight from your terminal:

```sh
loops knowledge query --event road-to-devcon-ix --problem chai-stall-terminal -q "<your question>"
```

**Via IDE** — once the skill is installed, your coding agent knows this battle; just ask it
in plain English inside your IDE:

> Ask "The Chai-Stall Terminal" knowledge graph: `<your question>`

### Agent harness install command

```sh
npx loopshouse add road-to-devcon-ix
```
