import { http, createConfig } from "wagmi";
import { baseSepolia, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * The club runs on Base Sepolia (problem's suggested stack) and Ethereum Sepolia.
 * Both chains are configured so wagmi can add them to the wallet on switch —
 * the member never has to paste an RPC by hand.
 */
export const config = createConfig({
  chains: [baseSepolia, sepolia],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http("https://base-sepolia-rpc.publicnode.com"),
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
