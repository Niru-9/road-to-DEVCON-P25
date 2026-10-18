import { useAccount, useReadContract } from "wagmi";
import { contractAbi } from "../abi";
import { useAppChain } from "../hooks/useAppChain";
import { useTx } from "../hooks/useTx";
import { ErrorPanel } from "./ErrorPanel";
import { formatTokens } from "../lib/format";

/**
 * The member's play-token balance + the one-time faucet.
 * Balance is a contract read keyed by the connected address.
 */
export function BalanceCard() {
  const { address } = useAccount();
  const { contractAddress, targetChain } = useAppChain();
  const tx = useTx();

  const balanceQuery = useReadContract({
    abi: contractAbi,
    address: contractAddress,
    functionName: "playBalance",
    args: address ? [address] : undefined,
    chainId: targetChain.id,
    query: {
      enabled: !!address && !!contractAddress,
      refetchInterval: 20_000,
    },
  });

  const faucetQuery = useReadContract({
    abi: contractAbi,
    address: contractAddress,
    functionName: "faucetUsed",
    args: address ? [address] : undefined,
    chainId: targetChain.id,
    query: { enabled: !!address && !!contractAddress },
  });

  if (!address) return null;

  const faucetUsed = faucetQuery.data === true;

  return (
    <section className="card balance-card">
      <div>
        <p className="muted">Your play-token balance</p>
        {balanceQuery.isError ? (
          <ErrorPanel
            message="Balance read failed."
            onRetry={() => balanceQuery.refetch()}
          />
        ) : (
          <p className="balance">
            {balanceQuery.data === undefined || balanceQuery.data === null
              ? "…"
              : formatTokens(balanceQuery.data as bigint)}{" "}
            <span className="unit">CHAI</span>
          </p>
        )}
      </div>
      {faucetUsed ? (
        <span className="badge badge-plain">Faucet claimed ✓</span>
      ) : (
        <button
          className="btn btn-primary"
          disabled={tx.wrongChain || tx.isSigning || tx.isConfirming}
          onClick={() => tx.send("faucet", [], "Faucet")}
          type="button"
        >
          {tx.isConfirming ? "Claiming…" : tx.isSigning ? "Confirm in wallet…" : "Get free play tokens"}
        </button>
      )}
      {tx.isConfirmed && tx.label === "Faucet" && (
        <p className="success-text">100 CHAI added — check your balance ✓</p>
      )}
      {tx.isReverted && tx.label === "Faucet" && (
        <p className="error-text">Faucet transaction failed — try again.</p>
      )}
    </section>
  );
}
