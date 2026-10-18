import { baseSepolia, sepolia } from "wagmi/chains";
import type { Address } from "viem";

export const APP_CHAINS = [baseSepolia, sepolia] as const;

function asAddress(value: string | undefined): Address | undefined {
  if (!value || !/^0x[0-9a-fA-F]{40}$/.test(value)) return undefined;
  return value as Address;
}

function asBlock(value: string | undefined): bigint {
  if (!value || !/^\d+$/.test(value)) return 0n;
  return BigInt(value);
}

/** Contract address per chain — set in .env.local (see .env.example). */
export const CONTRACT_ADDRESSES: Record<number, Address | undefined> = {
  [baseSepolia.id]: asAddress(import.meta.env.VITE_CONTRACT_ADDRESS_BASE_SEPOLIA),
  [sepolia.id]: asAddress(import.meta.env.VITE_CONTRACT_ADDRESS_SEPOLIA),
};

/** Deployment block per chain — keeps the positions event query to a tiny block range. */
export const DEPLOY_BLOCKS: Record<number, bigint> = {
  [baseSepolia.id]: asBlock(import.meta.env.VITE_DEPLOY_BLOCK_BASE_SEPOLIA),
  [sepolia.id]: asBlock(import.meta.env.VITE_DEPLOY_BLOCK_SEPOLIA),
};

/** Base Sepolia first: the write path compares the wallet against this chain by default. */
export function defaultChainId(): number {
  return CONTRACT_ADDRESSES[baseSepolia.id] ? baseSepolia.id : sepolia.id;
}
