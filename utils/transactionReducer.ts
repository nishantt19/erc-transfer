import type { TransactionFlow, TransactionAction } from "@/types";

export function transactionReducer(
  state: TransactionFlow,
  action: TransactionAction
): TransactionFlow {
  switch (action.type) {
    case "START_SIGNING":
      if (state.phase !== "idle") {
        console.warn(
          `Invalid transition: Cannot START_SIGNING from ${state.phase}`
        );
        return state;
      }
      return { phase: "signing" };

    case "SUBMIT_TRANSACTION":
      if (state.phase !== "signing") {
        console.warn(
          `Invalid transition: Cannot SUBMIT_TRANSACTION from ${state.phase}`
        );
        return state;
      }
      return {
        phase: "pending",
        ...action.payload,
        estimate: null,
      };

    case "UPDATE_ESTIMATE":
      if (state.phase !== "pending") {
        console.warn(
          `Invalid transition: Cannot UPDATE_ESTIMATE from ${state.phase}`
        );
        return state;
      }
      return {
        ...state,
        estimate: action.payload,
      };

    case "REPLACE_TRANSACTION":
      if (state.phase !== "pending") {
        console.warn(
          `Invalid transition: Cannot REPLACE_TRANSACTION from ${state.phase}`
        );
        return state;
      }
      return {
        ...state,
        hash: action.payload.newHash,
        wasReplaced: true,
      };

    case "CONFIRM_TRANSACTION":
      if (state.phase !== "pending") {
        console.warn(
          `Invalid transition: Cannot CONFIRM_TRANSACTION from ${state.phase}`
        );
        return state;
      }
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
      };

    case "RESET":
      return { phase: "idle" };

    default:
      return state;
  }
}
