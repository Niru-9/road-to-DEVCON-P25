import type { AbiEvent } from "viem";

export type BetLog = {
  args: {
    user: `0x${string}`;
    marketId: bigint;
    side: number;
    amount: bigint;
    timestamp: bigint;
  };
};

export type Position = {
  marketId: bigint;
  yes: bigint; // total wei bet on YES by this user
  no: bigint; // total wei bet on NO by this user
  lastBetAt: bigint;
};

/**
 * Turns the user-filtered `BetPlaced` event logs into per-market positions.
 * Pure bigint accumulation — no floats anywhere in this path.
 */
export function aggregatePositions(logs: BetLog[]): Position[] {
  const byMarket = new Map<string, Position>();
  for (const log of logs) {
    const { marketId, side, amount, timestamp } = log.args;
    const key = marketId.toString();
    let position = byMarket.get(key);
    if (!position) {
      position = { marketId, yes: 0n, no: 0n, lastBetAt: 0n };
      byMarket.set(key, position);
    }
    if (side === 1) {
      position.yes += amount;
    } else {
      position.no += amount;
    }
    if (timestamp > position.lastBetAt) position.lastBetAt = timestamp;
  }
  return [...byMarket.values()].sort((a, b) => (a.marketId > b.marketId ? -1 : 1));
}

/** The side this member leans toward (display hint only). */
export function mainSide(position: Position): "YES" | "NO" {
  return position.yes >= position.no ? "YES" : "NO";
}

export function stakeOn(position: Position, side: "YES" | "NO"): bigint {
  return side === "YES" ? position.yes : position.no;
}

/** Event ABI fragment used for the address-indexed positions query. */
export const BET_PLACED_EVENT = {
  type: "event",
  name: "BetPlaced",
  inputs: [
    { name: "user", type: "address", indexed: true },
    { name: "marketId", type: "uint256", indexed: true },
    { name: "side", type: "uint8", indexed: false },
    { name: "amount", type: "uint256", indexed: false },
    { name: "timestamp", type: "uint64", indexed: false },
  ],
} as const satisfies AbiEvent;
