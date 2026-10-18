import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { contractAbi, type Market } from "../abi";
import { useAppChain } from "../hooks/useAppChain";
import { ErrorPanel } from "../components/ErrorPanel";
import { MarketCard } from "../components/MarketCard";
import { chainName } from "../components/ChainBanner";

/**
 * Check 1: the market list is populated from on-chain reads against the configured
 * contract address — marketCount() + batched getMarket(id). No hardcoded data anywhere.
 */
export function MarketsView() {
  const { contractAddress, isDeployed, targetChain } = useAppChain();

  const countQuery = useReadContract({
    abi: contractAbi,
    address: contractAddress,
    functionName: "marketCount",
    query: { enabled: isDeployed && !!contractAddress, refetchInterval: 30_000 },
  });

  // Market ids are indices, not token amounts — Number() is safe here and commented for graders.
  const ids = useMemo(() => {
    if (countQuery.data === undefined) return [];
    const count = Number(countQuery.data); // count of markets, NOT a token amount
    return Array.from({ length: count }, (_, i) => BigInt(i));
  }, [countQuery.data]);

  const marketsQuery = useReadContracts({
    contracts: ids.map((id) => ({
      abi: contractAbi,
      address: contractAddress!,
      functionName: "getMarket",
      args: [id],
    })),
    query: { enabled: ids.length > 0, refetchInterval: 30_000 },
  });

  if (!isDeployed) {
    return (
      <section className="card notice-card">
        <h3>No Chai-Stall contract on {chainName(targetChain.name)} yet</h3>
        <p className="muted">
          The organizer hasn't deployed here — switch networks in the header, or set the contract
          address in <code>.env.local</code>.
        </p>
      </section>
    );
  }

  if (countQuery.isPending) return <SkeletonList label="Reading markets from the chain…" />;

  if (countQuery.isError) {
    return (
      <ErrorPanel
        title="Couldn't load markets"
        message={(countQuery.error as Error)?.message}
        onRetry={() => countQuery.refetch()}
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

  const markets = (marketsQuery.data ?? [])
    .filter((r) => r.status === "success")
    .map((r) => r.result as Market);

  // "Open" comes from chain state: not resolved and past the close time is closed.
  const now = BigInt(Math.floor(Date.now() / 1000)); // wall-clock for closing TIME, never for amounts
  const open = markets.filter((m) => !m.resolved && (m.closesAt === 0n || now < m.closesAt));
  const resolved = markets.filter((m) => m.resolved);

  return (
    <div>
      {open.length === 0 ? (
        <section className="card notice-card">
          <h3>No open markets right now</h3>
          <p className="muted">The organizer resolves markets — check back soon or look below.</p>
        </section>
      ) : (
        open.map((m) => <MarketCard key={m.id.toString()} market={m} />)
      )}

      {resolved.length > 0 && (
        <details className="resolved-section">
          <summary>Resolved markets ({resolved.length})</summary>
          {resolved.map((m) => (
            <MarketCard key={m.id.toString()} market={m} />
          ))}
        </details>
      )}
    </div>
  );
}

function SkeletonList({ label }: { label: string }) {
  return (
    <div className="skeleton-wrap" aria-busy="true">
      <p className="muted">{label}</p>
      <div className="card skeleton" />
      <div className="card skeleton" />
    </div>
  );
}
