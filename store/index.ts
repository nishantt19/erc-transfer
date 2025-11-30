/* eslint-disable @typescript-eslint/no-explicit-any */
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  createStateSyncMiddleware,
  initMessageListener,
  withReduxStateSync,
} from "redux-state-sync";
import transferFormReducer from "./slices/transferFormSlice";
import transactionReducer from "./slices/transactionSlice";
import toastReducer from "./slices/toastSlice";
import { TIMING_CONSTANTS, IS_BROWSER } from "@/constants";

/**
 * Custom serializers for bigint values in Redux state
 * Required because JSON.stringify doesn't support bigint natively
 */
const bigIntReplacer = (_key: string, value: any): any => {
  if (typeof value === "bigint") {
    return { __type: "bigint", value: value.toString() };
  }
  return value;
};

const bigIntReviver = (_key: string, value: any): any => {
  if (value && value.__type === "bigint") {
    return BigInt(value.value);
  }
  return value;
};

/**
 * Loads Redux state from localStorage on app initialization
 * Filters expired toasts and removes wallet context to prevent stale data
 */
const loadState = () => {
  try {
    if (!IS_BROWSER) return undefined;
    const serializedState = localStorage.getItem("erc20-transfer-state");
    if (serializedState === null) return undefined;

    const parsedState = JSON.parse(serializedState, bigIntReviver);

    // Remove expired toast messages
    if (parsedState.toast?.messages) {
      const now = Date.now();
      parsedState.toast.messages = parsedState.toast.messages.filter(
        (msg: any) => now - msg.timestamp < TIMING_CONSTANTS.TOAST_EXPIRY
      );
    }

    // Remove wallet context - will be validated separately
    if (parsedState._walletContext) {
      delete parsedState._walletContext;
    }

    return parsedState;
  } catch (err) {
    console.error("Failed to load state:", err);
    return undefined;
  }
};

const saveState = (
  state: RootState,
  walletContext?: { address?: string; chainId?: number }
) => {
  try {
    if (!IS_BROWSER) return;

    const serializableState = {
      transferForm: state.transferForm,
      transaction: state.transaction,
      toast: state.toast,
      _walletContext: walletContext || {
        address: undefined,
        chainId: undefined,
      },
    };

    const serializedState = JSON.stringify(serializableState, bigIntReplacer);
    localStorage.setItem("erc20-transfer-state", serializedState);
  } catch (err) {
    console.error("Failed to save state:", err);
  }
};

const throttle = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
};

/**
 * Redux state sync configuration for cross-tab communication
 * Syncs form and transaction state across browser tabs
 */
const syncConfig = {
  whitelist: [
    "transferForm/setSelectedToken",
    "transferForm/setAmount",
    "transferForm/setRecipient",
    "transferForm/setTokenAndResetAmount",
    "transferForm/resetForm",
    "transferForm/triggerBalanceRefetch",
    "transferForm/setGasError",
    "transferForm/setIsEstimating",
    "transferForm/clearAll",
    "transaction/startSigning",
    "transaction/submitTransaction",
    "transaction/updateEstimate",
    "transaction/replaceTransaction",
    "transaction/confirmTransaction",
    "transaction/resetTransaction",
    "toast/showToast",
    "toast/dismissToast",
    "toast/dismissAllToasts",
  ],
  channel: "erc20-transfer-sync",
  prepareState: (state: any) => state,
};

const stateSyncMiddleware = createStateSyncMiddleware(syncConfig);

const reducers = {
  transferForm: transferFormReducer,
  transaction: transactionReducer,
  toast: toastReducer,
};

const rootReducer = withReduxStateSync(combineReducers(reducers));

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: loadState(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Ignore bigint serialization warnings for blockchain data
      serializableCheck: {
        ignoredActions: [
          "@@INIT",
          "transaction/submitTransaction",
          "transaction/confirmTransaction",
          "transaction/updateEstimate",
        ],
        ignoredPaths: [
          "transaction.estimate.estimatedGasCost",
          "transaction.estimate.gasUsed",
          "transaction.blockNumber",
        ],
      },
    }).concat(stateSyncMiddleware as any),
});

let currentWalletContext: { address?: string; chainId?: number } = {
  address: undefined,
  chainId: undefined,
};

export const updateWalletContext = (address?: string, chainId?: number) => {
  currentWalletContext = { address, chainId };
};

export const getPersistedWalletContext = ():
  | { address?: string; chainId?: number }
  | undefined => {
  try {
    if (!IS_BROWSER) return undefined;
    const serializedState = localStorage.getItem("erc20-transfer-state");
    if (serializedState === null) return undefined;

    const parsedState = JSON.parse(serializedState);
    return parsedState._walletContext;
  } catch {
    return undefined;
  }
};

// Throttle localStorage writes to prevent excessive I/O
const throttledSaveState = throttle(
  (state: RootState, context: { address?: string; chainId?: number }) => {
    saveState(state, context);
  },
  TIMING_CONSTANTS.LOCALSTORAGE_SAVE_THROTTLE
);

// Initialize cross-tab state sync and localStorage persistence
if (IS_BROWSER) {
  initMessageListener(store);

  store.subscribe(() => {
    throttledSaveState(store.getState(), currentWalletContext);
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
