import { formatUnits } from "viem";

/** The contract tracks play tokens with 18 decimals (see DECIMALS in ChaiPredictionMarket.sol). */
export const TOKEN_DECIMALS = 18;

/**
 * The ONLY way a base-unit amount becomes something a human reads.
 * Never use Number(), parseFloat(), or `value / 1e18` on token amounts —
 * precision is preserved because formatUnits does string arithmetic on the bigint.
 */
export function formatTokens(wei: bigint): string {
  const full = formatUnits(wei, TOKEN_DECIMALS);
  const [int, frac = ""] = full.split(".");
  const trimmed = frac.slice(0, 4).replace(/0+$/, "");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return trimmed ? `${grouped}.${trimmed}` : grouped;
}

/**
 * All amount arithmetic happens in bigint BEFORE any formatting.
 * P&L = payout - staked, in wei, then formatted once.
 */
export function pnlWei(staked: bigint, payout: bigint): bigint {
  return payout - staked;
}

/**0x1234…abcd — addresses aren't token amounts, shortening is display-only. */
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Mirrors the contract's claim math: winners split the whole pool proportionally.
 * stake / winnerPool * (yesPool + noPool), integer division — same as the Solidity.
 */
export function payoutWei(stake: bigint, winnerPool: bigint, yesPool: bigint, noPool: bigint): bigint {
  if (winnerPool === 0n) return 0n;
  return (stake * (yesPool + noPool)) / winnerPool;
}
