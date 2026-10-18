import { useEffect, useRef, useState } from "react";
import { parseUnits } from "viem";
import type { Market } from "../abi";
import { useTx } from "../hooks/useTx";
import { useAppChain } from "../hooks/useAppChain";
import { formatTokens } from "../lib/format";
import { chainName } from "./ChainBanner";

/** Formats a unix timestamp (time, not a token amount) for display. */
function formatDate(unixSeconds: bigint): string {
  const date = new Date(Number(unixSeconds) * 1000);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function MarketCard({ market }: { market: Market }) {
  const tx = useTx();
  const { targetChain } = useAppChain();
  const [amountText, setAmountText] = useState("10");

  let amountWei: bigint | undefined;
  let amountError: string | undefined;
  try {
    amountWei = parseUnits(amountText.trim() || "0", 18);
    if (amountWei <= 0n) amountError = "Amount must be above zero";
  } catch {
    amountWei = undefined;
    amountError = "Digits and one dot only (e.g. 25.5)";
  }

  const explorerTx =
    tx.hash && targetChain.id === 84532
      ? `https://sepolia.basescan.org/tx/${tx.hash}`
      : tx.hash
        ? `https://sepolia.etherscan.io/tx/${tx.hash}`
        : undefined;

  const buttonsDisabled = tx.wrongChain || tx.isSigning || tx.isConfirming || !amountWei;

  return (
    <article className="card market-card">
      <header>
        <h3>{market.question}</h3>
        <div className="pools">
          <span className="pool pool-yes">YES pool {formatTokens(market.yesPool)}</span>
          <span className="pool pool-no">NO pool {formatTokens(market.noPool)}</span>
        </div>
        {market.closesAt > 0n && <p className="muted">Closes {formatDate(market.closesAt)}</p>}
      </header>

      <div className="bet-row">
        <input
          className="amount-input"
          inputMode="decimal"
          value={amountText}
          aria-label="Bet amount in play tokens"
          onChange={(e) => setAmountText(e.target.value)}
          placeholder="10"
        />
        <button
          className="btn btn-yes"
          disabled={buttonsDisabled}
          onClick={() => tx.send("placeBet", [market.id, 1, amountWei], "Bet YES")}
          type="button"
        >
          Bet YES
        </button>
        <button
          className="btn btn-no"
          disabled={buttonsDisabled}
          onClick={() => tx.send("placeBet", [market.id, 2, amountWei], "Bet NO")}
          type="button"
        >
          Bet NO
        </button>
      </div>
      {amountError && <p className="error-text">{amountError}</p>}
      {tx.wrongChain && (
        <p className="error-text">
          Wallet is on the wrong network — switch to {chainName(targetChain.name)} above.
        </p>
      )}

      <TxStatusStrip tx={tx} explorerTx={explorerTx} successNoun="Bet placed" />
    </article>
  );
}

/** Shared lifecycle display: signing → confirming (with receipt) → success only on receipt.status === "success". */
export function TxStatusStrip({
  tx,
  explorerTx,
  successNoun,
  onConfirmed,
}: {
  tx: ReturnType<typeof useTx>;
  explorerTx?: string;
  successNoun: string;
  onConfirmed?: () => void;
}) {
  if (tx.isConfirmed) {
    return (
      <p className="success-text" data-testid="tx-success">
        {successNoun} ✓ — confirmed on-chain
        {onConfirmed && <ConfirmedOnce onConfirm={onConfirmed} />}
      </p>
    );
  }
  if (tx.isReverted) {
    return (
      <div className="error-panel" role="alert">
        <strong>Transaction failed</strong>
        <p>
          {tx.signError?.message ??
            (tx.receiptError
              ? "Couldn't fetch the receipt — check the wallet activity."
              : "The transaction reverted on-chain.")}
        </p>
        <button className="btn btn-sm" onClick={tx.retryReceipt} type="button">
          Retry receipt
        </button>
      </div>
    );
  }
  if (tx.isSigning) return <p className="pending-text">Confirm in your wallet…</p>;
  if (tx.isConfirming)
    return (
      <p className="pending-text">
        Waiting for the network… {explorerTx && <a href={explorerTx} target="_blank" rel="noreferrer">watch the tx</a>}
      </p>
    );
  return null;
}

/** Fires the callback exactly once per confirmed transaction (query invalidation). */
function ConfirmedOnce({ onConfirm }: { onConfirm: () => void }) {
  const fired = useRef(false);
  useEffect(() => {
    if (!fired.current) {
      fired.current = true;
      onConfirm();
    }
  }, [onConfirm]);
  return null;
}
