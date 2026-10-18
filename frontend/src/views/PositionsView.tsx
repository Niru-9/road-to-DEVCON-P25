import { useMemo } from "react";
import { useAccount, usePublicClient, useReadContract, useReadContracts } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { contractAbi, type Market } from "../abi";
import { useAppChain } from "../hooks/useAppChain";
import { useTx } from "../hooks/useTx";
import { ErrorPanel } from "../components/ErrorPanel";
import { TxStatusStrip } from "../components/MarketCard";
import { ConnectButton } from "../components/ConnectButton";
import { chainName } from "../components/ChainBanner";
import { BET_PLACED_EVENT, aggregatePositions, mainSide, stakeOn, type BetLog, type Position } from "../lib/positions";
import { formatTokens, payoutWei, pnlWei } from "../lib/format";

/**
 * Check 4: positions come from ONE address-indexed event filter —
 * `getLogs({ event: BetPlaced, args: { user } })`. The frontend never
 * iterates market ids to find a user's bets.
 *
 * Check 2: the view renders those positions for the connected wallet address.
 */
export function PositionsView() {
  const { address } = useAccount();
  const { contractAddress, targetChain, deployBlock, isDeployed } = useAppChain();
  const publicClient = usePublicClient({ chainId: targetChain.id });
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ["bet-logs", address, targetChain.id, contractAddress],
    queryFn: async (): Promise<BetLog[]> => {
      const logs = await publicClient!.getLogs({
        address: contractAddress!,
        event: BET_PLACED_EVENT,
        args: { user: address! }, // <- the indexed address filter that makes this one query
        fromBlock: deployBlock, // contract deploy block — keeps the range tiny on flaky Wi-Fi
        toBlock: "latest",
      });
      return logs.map((log) => ({
        args: {
          user: log.args.user!,
          marketId: log.args.marketId!,
          side: log.args.side!,
          amount: log.args.amount!, // base units (wei) — formatted only at the display edge
          timestamp: log.args.timestamp!,
        },
      }));
    },
    enabled: !!address && !!contractAddress && !!publicClient && isDeployed,
    refetchInterval: 30_000,
  });

  const positions = useMemo(() => aggregatePositions(logsQuery.data ?? []), [logsQuery.data]);

  const marketsQuery = useReadContracts({
    contracts: positions.map((p) => ({
      chainId: targetChain.id,
      abi: contractAbi,
      address: contractAddress!,
      functionName: "getMarket",
      args: [p.marketId],
    })),
    query: { enabled: positions.length > 0 && !!contractAddress },
  });

  const claimedQuery = useReadContracts({
    contracts: positions.map((p) => ({
      chainId: targetChain.id,
      abi: contractAbi,
      address: contractAddress!,
      functionName: "claimed",
      args: [address!, p.marketId],
    })),
    query: { enabled: positions.length > 0 && !!address && !!contractAddress },
  });

  const balanceQuery = useReadContract({
    abi: contractAbi,
    address: contractAddress,
    functionName: "playBalance",
    args: address ? [address] : undefined,
    chainId: targetChain.id,
    query: { enabled: !!address && !!contractAddress },
  });

  if (!address) {
    return (
      <section className="card notice-card">
        <h3>See what you hold</h3>
        <p className="muted">Connect your wallet to read your positions from the chain.</p>
        <ConnectButton />
      </section>
    );
  }
  if (!isDeployed) {
    return (
      <section className="card notice-card">
        <h3>No contract on {chainName(targetChain.name)}</h3>
        <p className="muted">Switch networks in the header to read your positions.</p>
      </section>
    );
  }

  if (logsQuery.isPending) return <div className="skeleton-wrap"><p className="muted">Reading your positions from the chain…</p><div className="card skeleton" /></div>;

  if (logsQuery.isError) {
    return (
      <ErrorPanel
        title="Couldn't load your positions"
        message={(logsQuery.error as Error)?.message}
        onRetry={() => logsQuery.refetch()}
      />
    );
  }
  if (marketsQuery.isError) {
    return (
      <ErrorPanel
        title="Couldn't load market details"
        message={(marketsQuery.error as Error)?.message}
        onRetry={() => marketsQuery.refetch()}
      />
    );
  }

  const marketsById = new Map<string, Market>();
  (marketsQuery.data ?? []).forEach((r, i) => {
    if (r.status === "success" && positions[i]) {
      marketsById.set(positions[i].marketId.toString(), r.result as Market);
    }
  });
  const claimedSet = new Set<string>();
  (claimedQuery.data ?? []).forEach((r, i) => {
    if (r.status === "success" && r.result === true && positions[i]) {
      claimedSet.add(positions[i].marketId.toString());
    }
  });

  const invalidate = () => {
    queryClient.invalidateQueries();
  };

  return (
    <div>
      <section className="card balance-line">
        <span className="muted">Play-token balance</span>
        <strong>
          {balanceQuery.data === undefined || balanceQuery.data === null
            ? "…"
            : formatTokens(balanceQuery.data as bigint)}{" "}
          CHAI
        </strong>
        {balanceQuery.isError && (
          <ErrorPanel message="Balance read failed." onRetry={() => balanceQuery.refetch()} />
        )}
      </section>

      {positions.length === 0 ? (
        <section className="card notice-card">
          <h3>No positions yet</h3>
          <p className="muted">Open a market and place a play-token bet — it'll show up here.</p>
        </section>
      ) : (
        positions.map((p) => (
          <PositionRow
            key={p.marketId.toString()}
            position={p}
            market={marketsById.get(p.marketId.toString())}
            claimed={claimedSet.has(p.marketId.toString())}
            onClaimed={invalidate}
          />
        ))
      )}
    </div>
  );
}

function PositionRow({
  position,
  market,
  claimed,
  onClaimed,
}: {
  position: Position;
  market: Market | undefined;
  claimed: boolean;
  onClaimed: () => void;
}) {
  const side = mainSide(position);
  const stake = stakeOn(position, side);

  if (!market) {
    return (
      <section className="card position-card">
        <h3>Market #{position.marketId.toString()}</h3>
        <p className="muted">YES {formatTokens(position.yes)} · NO {formatTokens(position.no)}</p>
        <p className="muted">Market details still loading…</p>
      </section>
    );
  }

  const winningSide = market.winningSide === 1 ? "YES" : market.winningSide === 2 ? "NO" : undefined;
  const myStakeOnWinning = winningSide ? stakeOn(position, winningSide) : 0n;

  let status: React.ReactNode;
  if (!market.resolved) {
    status = <span className="badge badge-open">OPEN</span>;
  } else if (myStakeOnWinning > 0n) {
    // Check 3: P&L arithmetic in bigint, formatted only at the edge
    const winnerPool = winningSide === "YES" ? market.yesPool : market.noPool;
    const payout = payoutWei(myStakeOnWinning, winnerPool, market.yesPool, market.noPool);
    const profit = pnlWei(myStakeOnWinning, payout); // bigint subtraction
    status = (
      <div className="win-block">
        <span className="badge badge-won">WON ✓</span>
        <p>
          Won <strong>{formatTokens(payout)}</strong> CHAI (staked {formatTokens(myStakeOnWinning)},
          profit <strong>+{formatTokens(profit)}</strong>)
        </p>
        {claimed ? (
          <span className="badge badge-plain">Claimed ✓</span>
        ) : (
          /* Check 7: the claim control only renders when the chain read says resolved + winning */
          <ClaimButton marketId={position.marketId} onConfirmed={onClaimed} />
        )}
      </div>
    );
  } else {
    status = (
      <div>
        <span className="badge badge-lost">LOST</span>
        <p className="muted">Staked {formatTokens(stakeOn(position, winningSide ?? side))} CHAI on the losing side.</p>
      </div>
    );
  }

  return (
    <section className="card position-card">
      <h3>{market.question}</h3>
      <p className="position-bets">
        You bet: <span className="pool pool-yes">YES {formatTokens(position.yes)}</span>{" "}
        <span className="pool pool-no">NO {formatTokens(position.no)}</span>
      </p>
      {status}
    </section>
  );
}

/**
 * Check 5: disabled while the wallet is on the wrong chain, with a switch prompt,
 * and `chainId` is passed to the write itself (see useTx).
 * Check 6: success renders only from a mined receipt with status "success".
 */
function ClaimButton({ marketId, onConfirmed }: { marketId: bigint; onConfirmed: () => void }) {
  const tx = useTx();
  const { targetChain } = useAppChain();

  return (
    <div className="claim-block">
      <button
        className="btn btn-primary"
        disabled={tx.wrongChain || tx.isSigning || tx.isConfirming}
        onClick={() => tx.send("claim", [marketId], "Claim")}
        type="button"
      >
        {tx.isConfirming ? "Claiming…" : tx.isSigning ? "Confirm in wallet…" : "Claim winnings"}
      </button>
      {tx.wrongChain && (
        <p className="error-text">Switch to {chainName(targetChain.name)} to claim.</p>
      )}
      <TxStatusStrip tx={tx} successNoun="Winnings claimed" onConfirmed={onConfirmed} />
    </div>
  );
}
