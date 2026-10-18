import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Address } from "viem";
import { APP_CHAINS, CONTRACT_ADDRESSES, DEPLOY_BLOCKS, defaultChainId } from "../config/env";

type AppChain = (typeof APP_CHAINS)[number];

type AppChainValue = {
  /** The chain the app is *targeting* — writes are guarded and tagged with this chain. */
  targetChain: AppChain;
  setTargetChain: (chainId: number) => void;
  contractAddress: Address | undefined;
  deployBlock: bigint;
  isDeployed: boolean;
};

const AppChainContext = createContext<AppChainValue | null>(null);

export function AppChainProvider({ children }: { children: ReactNode }) {
  const [chainId, setChainId] = useState<number>(defaultChainId);

  const value = useMemo<AppChainValue>(() => {
    const targetChain = APP_CHAINS.find((c) => c.id === chainId) ?? APP_CHAINS[0];
    const contractAddress = CONTRACT_ADDRESSES[targetChain.id];
    return {
      targetChain,
      setTargetChain: setChainId,
      contractAddress,
      deployBlock: DEPLOY_BLOCKS[targetChain.id] ?? 0n,
      isDeployed: contractAddress !== undefined,
    };
  }, [chainId]);

  return <AppChainContext.Provider value={value}>{children}</AppChainContext.Provider>;
}

export function useAppChain(): AppChainValue {
  const ctx = useContext(AppChainContext);
  if (!ctx) throw new Error("useAppChain must be used within AppChainProvider");
  return ctx;
}
