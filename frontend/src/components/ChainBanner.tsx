import { useAccount, useSwitchChain } from "wagmi";
import { useAppChain } from "../hooks/useAppChain";

/** Shown whenever the wallet sits on a different chain than the app — writes are blocked until switched. */
export function ChainBanner() {
  const { chainId, isConnected } = useAccount();
  const { targetChain } = useAppChain();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chainId === undefined || chainId === targetChain.id) return null;

  return (
    <div className="chain-banner" role="status">
      <span>
        Wallet is on another network — switch to <strong>{chainName(targetChain.name)}</strong> to
        bet or claim.
      </span>
      <button
        className="btn btn-primary btn-sm"
        disabled={isPending}
        onClick={() => switchChain({ chainId: targetChain.id })}
        type="button"
      >
        {isPending ? "Switching…" : `Switch to ${chainName(targetChain.name)}`}
      </button>
    </div>
  );
}

export function chainName(name: string): string {
  return name === "baseSepolia" ? "Base Sepolia" : name === "sepolia" ? "Sepolia" : name;
}
