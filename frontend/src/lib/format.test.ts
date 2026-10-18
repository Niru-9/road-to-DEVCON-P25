import { describe, expect, it } from "vitest";
import { formatTokens, payoutWei, pnlWei, TOKEN_DECIMALS } from "./format";

describe("formatTokens", () => {
  it("formats whole base units with grouping", () => {
    expect(formatTokens(10n * 10n ** 18n)).toBe("10");
    expect(formatTokens(1_234n * 10n ** 18n)).toBe("1,234");
  });

  it("keeps sub-unit precision without float rounding", () => {
    // 0.1 cannot be represented exactly as a float — formatUnits can
    expect(formatTokens(10n ** 17n)).toBe("0.1");
    expect(formatTokens(123_456_789_012_345_678_901n)).toBe("123.4567");
    expect(formatTokens(123_456_789_012_345_678_901_234n)).toBe("123,456.789");
  });

  it("renders zero", () => {
    expect(formatTokens(0n)).toBe("0");
  });
});

describe("pnl / payout (all bigint before formatting)", () => {
  it("mirrors the contract's proportional payout", () => {
    // staked 30 on YES, pools 60 YES / 40 NO → payout = 30 * 100 / 60
    const payout = payoutWei(30n * 10n ** 18n, 60n * 10n ** 18n, 60n * 10n ** 18n, 40n * 10n ** 18n);
    expect(payout).toBe(50n * 10n ** 18n);
  });

  it("computes P&L as an exact bigint subtraction", () => {
    const staked = 30n * 10n ** 18n;
    const payout = 50n * 10n ** 18n;
    expect(pnlWei(staked, payout)).toBe(20n * 10n ** 18n);
    expect(pnlWei(payout, staked)).toBe(-20n * 10n ** 18n);
  });

  it("has 18 decimals like the contract", () => {
    expect(TOKEN_DECIMALS).toBe(18);
  });
});
