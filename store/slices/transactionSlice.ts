import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { TransactionFlow, TransactionEstimate } from "@/types";

// Represents the transaction state machine
const initialState: TransactionFlow = { phase: "idle" };

export const transactionSlice = createSlice({
  name: "transaction",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialState: initialState as any,
  reducers: {
    startSigning: () => {
      return { phase: "signing" } as TransactionFlow;
    },
    // Set transaction as submitted and mark it as pending
    submitTransaction: (
      _state,
      action: PayloadAction<{
        hash: `0x${string}`;
        submittedAt: number;
        amount: string;
        recipient: string;
        tokenSymbol: string;
        isNativeToken: boolean;
      }>
    ) => {
      return {
        phase: "pending",
        ...action.payload,
        estimate: null, // Real estimate will be filled once gas calc finishes
        wasReplaced: false, // Indicates whether tx was replaced via speedup/cancel
      } as TransactionFlow;
    },
    // Update gas estimate for pending transaction
    updateEstimate: (state, action: PayloadAction<TransactionEstimate>) => {
      if (state.phase === "pending") {
        return {
          phase: "pending",
          hash: state.hash,
          submittedAt: state.submittedAt,
          amount: state.amount,
          recipient: state.recipient,
          tokenSymbol: state.tokenSymbol,
          isNativeToken: state.isNativeToken,
          wasReplaced: state.wasReplaced || false,
          estimate: action.payload,
        } as TransactionFlow;
      }
      return state;
    },
    // Handle transaction replacement (speedup or cancel)
    replaceTransaction: (
      state,
      action: PayloadAction<{ newHash: `0x${string}` }>
    ) => {
      if (state.phase === "pending") {
        return {
          phase: "pending",
          hash: action.payload.newHash, // Update to new hash
          submittedAt: state.submittedAt,
          amount: state.amount,
          recipient: state.recipient,
          tokenSymbol: state.tokenSymbol,
          isNativeToken: state.isNativeToken,
          estimate: state.estimate,
          wasReplaced: true,
        } as TransactionFlow;
      }
      return state;
    },
    // Transaction has been included in a block
    confirmTransaction: (
      state,
      action: PayloadAction<{
        blockNumber: bigint;
        confirmedAt: number;
        completionTimeSeconds: number;
      }>
    ) => {
      if (state.phase === "pending") {
        return {
          phase: "confirmed",
          hash: state.hash,
          submittedAt: state.submittedAt,
          amount: state.amount,
          recipient: state.recipient,
          tokenSymbol: state.tokenSymbol,
          isNativeToken: state.isNativeToken,
          wasReplaced: state.wasReplaced,
          ...action.payload,
        } as TransactionFlow;
      }
      return state;
    },
    // Reset transaction state to initial idle state
    resetTransaction: () => initialState,
    // Clear pending transaction if wallet/chain context changed to prevent stale data
    validateTransactionAndClearIfNeeded: (
      state,
      action: PayloadAction<{
        address?: string;
        chainId?: number;
        persistedContext?: { address?: string; chainId?: number };
      }>
    ) => {
      const { address, chainId, persistedContext } = action.payload;

      // If context is missing, keep existing state as-is
      if (
        !persistedContext ||
        !persistedContext.address ||
        !persistedContext.chainId
      ) {
        return state;
      }

      // Clear transaction if address or chainId changed
      if (
        persistedContext.address !== address ||
        persistedContext.chainId !== chainId
      ) {
        return initialState;
      }

      return state;
    },
  },
});

export const {
  startSigning,
  submitTransaction,
  updateEstimate,
  replaceTransaction,
  confirmTransaction,
  resetTransaction,
  validateTransactionAndClearIfNeeded,
} = transactionSlice.actions;

export default transactionSlice.reducer;
