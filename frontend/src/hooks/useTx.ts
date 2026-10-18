import { useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import type { Abi, Hash } from "viem";
import { contractAbi } from "../abi";
import { useAppChain } from "./useAppChain";

export type TxState = {
  /** Send a write to the reference contract on the app's target chain. */
  send: (functionName: string, args: unknown[], label: string) => Promise<void>;
  /** Check 5: true when the wallet chain differs from the app's target chain (Base Sepolia by default). */
  wrongChain: boolean;
  isSigning: boolean;
  isConfirming: boolean;
  /** Check 6: success is only ever true for a mined receipt with status "success". */
  isConfirmed: boolean;
  isReverted: boolean;
  signError: Error | null;
  receiptError: boolean;
  retryReceipt: () => void;
  hash: Hash | undefined;
  label: string;
  reset: () => void;
};

/**
 * The single write path for every state-changing call.
 *
 * Check 5 — the wallet's chain is compared against the target chain, AND `chainId`
 * is passed to writeContract so viem refuses to send on any other network.
 *
 * Check 6 — "success" is derived exclusively from a mined transaction receipt whose
 * status is "success". A returned hash or a resolved write never counts as success.
 */
export function useTx(): TxState {
  const { isConnected, chainId } = useAccount();
  const { targetChain, contractAddress } = useAppChain();
  const {
    writeContractAsync,
    isPending: isSigning,
    error: signError,
    reset: resetWrite,
  } = useWriteContract();
  const [hash, setHash] = useState<Hash | undefined>();
  const [label, setLabel] = useState("");

  const receipt = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  const wrongChain = isConnected && chainId !== undefined && chainId !== targetChain.id;

  const send = async (functionName: string, args: unknown[], txLabel: string) => {
    if (!contractAddress) return;
    setHash(undefined);
    setLabel(txLabel);
    try {
      const sent = await writeContractAsync({
        abi: contractAbi as Abi,
        address: contractAddress,
        functionName,
        args,
        chainId: targetChain.id, // viem errors out if the wallet sits on another chain
      } as never);
      setHash(sent);
    } catch {
      // wallet rejected or RPC failed — surfaced through signError below
    }
  };

  const isConfirmed = receipt.data?.status === "success";
  const isReverted = receipt.data?.status === "reverted" || receipt.isError;
  const isConfirming = !!hash && !receipt.data && !receipt.isError;

  const reset = () => {
    setHash(undefined);
    setLabel("");
    resetWrite();
  };

  return {
    send,
    wrongChain,
    isSigning,
    isConfirming,
    isConfirmed,
    isReverted,
    signError: signError instanceof Error ? signError : null,
    receiptError: receipt.isError,
    retryReceipt: receipt.refetch,
    hash,
    label,
    reset,
  };
}
