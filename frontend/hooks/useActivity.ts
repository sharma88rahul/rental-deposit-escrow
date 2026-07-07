import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActivityStore } from "@/store/useActivityStore";
import { useWalletStore } from "@/store/useWalletStore";
import { SorobanClient } from "@/services/soroban-client";
import { EventService } from "@/services/event";
import { Transaction } from "@/types";

export function useActivity() {
  const queryClient = useQueryClient();
  const { transactions, activities, addTransaction, updateTransactionStatus, retryTransaction } = useActivityStore();

  // Listen to live events on mount
  React.useEffect(() => {
    EventService.startSubscription();
    
    const walletState = useWalletStore.getState();
    if (walletState.connected && walletState.walletAddress) {
      SorobanClient.fetchHorizonTransactions(walletState.walletAddress).then((txs) => {
        if (txs && txs.length > 0) {
          useActivityStore.setState({ transactions: txs });
        }
      });
    }

    return () => {
      EventService.stopSubscription();
    };
  }, []);

  // Fetch transactions query
  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: () => {
      // Return cached store values
      return useActivityStore.getState().transactions;
    },
    refetchInterval: 3000, // Sync polling every 3s
  });

  // Fetch activity feed query
  const activitiesQuery = useQuery({
    queryKey: ["activities"],
    queryFn: () => {
      return useActivityStore.getState().activities;
    },
    refetchInterval: 3000,
  });

  // Retry failed transactions mutation
  const retryTxMutation = useMutation({
    mutationFn: async (hash: string) => {
      retryTransaction(hash);
      // Simulate transaction retry delay
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          const success = Math.random() > 0.3; // 70% success rate simulation on retry
          if (success) {
            updateTransactionStatus(hash, "Confirmed");
            resolve();
          } else {
            updateTransactionStatus(hash, "Failed");
            reject(new Error("Soroban simulation reverted: sequence collision."));
          }
        }, 1500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  // Broadcast new transaction mutation
  const broadcastTxMutation = useMutation({
    mutationFn: async (tx: Transaction) => {
      addTransaction(tx);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  return {
    transactionsQuery,
    activitiesQuery,
    retryTxMutation,
    broadcastTxMutation,
  };
}
