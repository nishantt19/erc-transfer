import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ToastType = "success" | "error" | "info" | "loading";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  timestamp: number;
}

interface ToastState {
  messages: ToastMessage[];
  activeToastId: string | null;
  dismissedToastIds: string[]; // Keep track of dismissed toasts to prevent re-showing
  loadingToastId: string | null; // Track current loading toast
}

const initialState: ToastState = {
  messages: [],
  activeToastId: null,
  dismissedToastIds: [],
  loadingToastId: null,
};

export const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    showToast: (
      state,
      action: PayloadAction<{
        id: string;
        type: ToastType;
        message: string;
        description?: string;
      }>
    ) => {
      const { id, type, message, description } = action.payload;
      const timestamp = Date.now();

      // Auto-dismiss previous loading toast when showing new toast
      if (state.loadingToastId && state.loadingToastId !== id) {
        const previousLoadingId = state.loadingToastId;
        state.messages = state.messages.filter(
          (t) => t.id !== previousLoadingId
        );

        if (!state.dismissedToastIds.includes(previousLoadingId)) {
          state.dismissedToastIds.push(previousLoadingId);
        }

        state.loadingToastId = null;
      }

      // Remove existing toast with same ID to prevent duplicates
      state.messages = state.messages.filter((t) => t.id !== id);

      // Add new toast message
      state.messages.push({
        id,
        type,
        message,
        description,
        timestamp,
      });

      state.activeToastId = id;

      // Track active loading toast ID
      if (type === "loading") {
        state.loadingToastId = id;
      }
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      const toastId = action.payload;
      // Remove toast from visible list
      state.messages = state.messages.filter((t) => t.id !== toastId);

      if (!state.dismissedToastIds.includes(toastId)) {
        state.dismissedToastIds.push(toastId);
      }

      if (state.dismissedToastIds.length > 50) {
        state.dismissedToastIds = state.dismissedToastIds.slice(-50);
      }

      // Clear references if dismissing active/loading toast
      if (state.activeToastId === toastId) {
        state.activeToastId = null;
      }

      if (state.loadingToastId === toastId) {
        state.loadingToastId = null;
      }
    },
    dismissAllToasts: (state) => {
      // Mark all current toasts as dismissed
      state.messages.forEach((t) => {
        if (!state.dismissedToastIds.includes(t.id)) {
          state.dismissedToastIds.push(t.id);
        }
      });

      state.messages = [];
      state.activeToastId = null;
      state.loadingToastId = null;
    },
  },
});

export const { showToast, dismissToast, dismissAllToasts } = toastSlice.actions;

export default toastSlice.reducer;
