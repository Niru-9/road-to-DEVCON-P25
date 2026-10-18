import type { Abi } from "viem";
import abiJson from "./ChaiPredictionMarket.json";

/** The reference ABI, exported from the compiled contract artifact. */
export const contractAbi = abiJson as Abi;

/** Mirror of the Solidity `Market` struct as viem decodes it from getMarket(). */
export type Market = {
  id: bigint;
  question: string;
  closesAt: bigint;
  resolved: boolean;
  winningSide: number; // 0 none, 1 YES, 2 NO
  yesPool: bigint;
  noPool: bigint;
  createdAt: bigint;
};
