import { useState } from "react";
import { useAppChain } from "./hooks/useAppChain";
import { APP_CHAINS } from "./config/env";
import { ConnectButton } from "./components/ConnectButton";
import { ChainBanner, chainName } from "./components/ChainBanner";
import { BalanceCard } from "./components/BalanceCard";
import { MarketsView } from "./views/MarketsView";
import { PositionsView } from "./views/PositionsView";
import { CONTRACT_ADDRESSES } from "./config/env";

export default function App() {
  const { targetChain, setTargetChain } = useAppChain();
  const [tab, setTab] = useState<"markets" | "positions">("markets");

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>☕</span>
          <div>
            <h1>Chai-Stall Terminal</h1>
            <p className="tagline">The forecasting club's one screen</p>
          </div>
        </div>
        <ConnectButton />
      </header>

      <nav className="chain-toggle" aria-label="Network">
        {APP_CHAINS.map((chain) => (
          <button
            key={chain.id}
            className={`pill ${chain.id === targetChain.id ? "pill-active" : ""}`}
            onClick={() => setTargetChain(chain.id)}
            type="button"
          >
            {chainName(chain.name)}
            {!CONTRACT_ADDRESSES[chain.id] && <span className="pill-dot" title="Not deployed" />}
          </button>
        ))}
      </nav>

      <ChainBanner />
      <BalanceCard />

      <nav className="tabs" aria-label="Views">
        <button
          className={`tab ${tab === "markets" ? "tab-active" : ""}`}
          onClick={() => setTab("markets")}
          type="button"
        >
          Open markets
        </button>
        <button
          className={`tab ${tab === "positions" ? "tab-active" : ""}`}
          onClick={() => setTab("positions")}
          type="button"
        >
          My positions
        </button>
      </nav>

      <main>{tab === "markets" ? <MarketsView /> : <PositionsView />}</main>

      <footer>
        <p>
          Play tokens only — nothing here touches real money. Forecasts, not fortunes.
        </p>
      </footer>
    </div>
  );
}
