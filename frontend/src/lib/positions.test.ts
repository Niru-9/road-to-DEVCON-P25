import { describe, expect, it } from "vitest";
import { aggregatePositions, mainSide, stakeOn, type BetLog } from "./positions";

const USER = "0x1111111111111111111111111111111111111111" as const;

function bet(marketId: bigint, side: number, amount: bigint, timestamp: bigint): BetLog {
  return { args: { user: USER, marketId, side, amount, timestamp } };
}

describe("aggregatePositions", () => {
  it("accumulates multiple bets per market in bigint", () => {
    const logs = [
      bet(1n, 1, 10n * 10n ** 18n, 100n),
      bet(1n, 1, 5n * 10n ** 18n, 200n),
      bet(1n, 2, 2n * 10n ** 18n, 150n),
    ];
    const positions = aggregatePositions(logs);
    expect(positions).toHaveLength(1);
    expect(positions[0].yes).toBe(15n * 10n ** 18n);
    expect(positions[0].no).toBe(2n * 10n ** 18n);
    expect(positions[0].lastBetAt).toBe(200n);
  });

  it("keeps markets separate and sorts newest id first", () => {
    const positions = aggregatePositions([bet(0n, 1, 1n, 1n), bet(2n, 2, 1n, 2n)]);
    expect(positions.map((p) => p.marketId)).toEqual([2n, 0n]);
  });

  it("does not lose precision on huge base units", () => {
    const huge = 123_456_789_012_345_678_901_234n;
    const positions = aggregatePositions([bet(1n, 1, huge, 1n)]);
    expect(positions[0].yes).toBe(huge);
  });
});

describe("mainSide / stakeOn", () => {
  it("reports the heavier side", () => {
    const [p] = aggregatePositions([bet(1n, 1, 5n, 1n), bet(1n, 2, 7n, 2n)]);
    expect(mainSide(p)).toBe("NO");
    expect(stakeOn(p, "NO")).toBe(7n);
    expect(stakeOn(p, "YES")).toBe(5n);
  });
});
