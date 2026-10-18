import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortenAddress } from "../lib/format";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="wallet">
        <span className="wallet-addr" title={address}>
          {shortenAddress(address)}
        </span>
        <button className="btn btn-ghost" onClick={() => disconnect()} type="button">
          Disconnect
        </button>
      </div>
    );
  }

  const injected = connectors.find((c) => c.type === "injected") ?? connectors[0];

  return (
    <div className="wallet">
      <button
        className="btn btn-primary"
        disabled={!injected || isPending}
        onClick={() => injected && connect({ connector: injected })}
        type="button"
      >
        {isPending ? "Opening wallet…" : "Connect wallet"}
      </button>
      {!injected && <p className="hint">No wallet detected — install MetaMask.</p>}
      {error && <p className="error-text">{error.message}</p>}
    </div>
  );
}
