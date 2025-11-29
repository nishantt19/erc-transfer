import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Token } from '@/types';

interface TransferFormState {
  selectedToken: Token | null;
  amount: string;
  recipient: string;
  refetchTrigger: number;
  showGasError: boolean;
  isEstimating: boolean;
}

const initialState: TransferFormState = {
  selectedToken: null,
  amount: '',
  recipient: '',
  refetchTrigger: 0,
  showGasError: false,
  isEstimating: false,
};

export const transferFormSlice = createSlice({
  name: 'transferForm',
  initialState,
  reducers: {
    setSelectedToken: (state, action: PayloadAction<Token | null>) => {
      state.selectedToken = action.payload;
    },
    setAmount: (state, action: PayloadAction<string>) => {
      state.amount = action.payload;
    },
    setRecipient: (state, action: PayloadAction<string>) => {
      state.recipient = action.payload;
    },
    resetForm: (state) => {
      state.amount = '';
      state.recipient = '';
    },
    triggerBalanceRefetch: (state) => {
      state.refetchTrigger = Date.now();
    },
    setGasError: (state, action: PayloadAction<boolean>) => {
      state.showGasError = action.payload;
    },
    setIsEstimating: (state, action: PayloadAction<boolean>) => {
      state.isEstimating = action.payload;
    },
    clearAll: () => initialState,
    validateAndClearIfNeeded: (
      state,
      action: PayloadAction<{ address?: string; chainId?: number; persistedContext?: { address?: string; chainId?: number } }>
    ) => {
      const { address, chainId, persistedContext } = action.payload;

      if (!persistedContext || !persistedContext.address || !persistedContext.chainId) {
        return state;
      }

      if (persistedContext.address !== address || persistedContext.chainId !== chainId) {
        return initialState;
      }

      return state;
    },
  },
});

export const {
  setSelectedToken,
  setAmount,
  setRecipient,
  resetForm,
  triggerBalanceRefetch,
  setGasError,
  setIsEstimating,
  clearAll,
  validateAndClearIfNeeded,
} = transferFormSlice.actions;

export default transferFormSlice.reducer;
