import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  showToast,
  dismissToast,
  dismissAllToasts,
} from "@/store/slices/toastSlice";

export const useToastSync = () => {
  const dispatch = useAppDispatch();
  const toastMessages = useAppSelector((state) => state.toast.messages);
  const activeToastId = useAppSelector((state) => state.toast.activeToastId);
  const dismissedToastIds = useAppSelector(
    (state) => state.toast.dismissedToastIds
  );
  const loadingToastId = useAppSelector((state) => state.toast.loadingToastId);
  const processedToastsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    if (isInitialMountRef.current && toastMessages.length > 0) {
      isInitialMountRef.current = false;

      toastMessages.forEach((toastMsg) => {
        if (!dismissedToastIds.includes(toastMsg.id) && !processedToastsRef.current.has(toastMsg.id)) {
          processedToastsRef.current.add(toastMsg.id);

          const toastFn = toast[toastMsg.type] || toast;
          toastFn(toastMsg.message, {
            description: toastMsg.description,
            id: toastMsg.id,
          });
        }
      });
    }
  }, [toastMessages, dismissedToastIds]);

  useEffect(() => {
    if (dismissedToastIds && dismissedToastIds.length > 0) {
      dismissedToastIds.forEach((toastId) => {
        toast.dismiss(toastId);
      });
    }
  }, [dismissedToastIds]);

  useEffect(() => {
    if (isInitialMountRef.current) return;

    if (!activeToastId) return;

    const latestToast = toastMessages.find((t) => t.id === activeToastId);
    if (!latestToast) return;

    if (processedToastsRef.current.has(latestToast.id)) return;

    processedToastsRef.current.add(latestToast.id);

    const toastFn = toast[latestToast.type] || toast;
    toastFn(latestToast.message, {
      description: latestToast.description,
      id: latestToast.id,
    });

    if (processedToastsRef.current.size > 20) {
      const toastsArray = Array.from(processedToastsRef.current);
      processedToastsRef.current = new Set(toastsArray.slice(-20));
    }
  }, [toastMessages, activeToastId]);

  const syncedToast = {
    success: (message: string, options?: { description?: string }) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      dispatch(
        showToast({
          id,
          type: "success",
          message,
          description: options?.description,
        })
      );
    },
    error: (message: string, options?: { description?: string }) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      dispatch(
        showToast({
          id,
          type: "error",
          message,
          description: options?.description,
        })
      );
    },
    info: (message: string, options?: { description?: string }) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      dispatch(
        showToast({
          id,
          type: "info",
          message,
          description: options?.description,
        })
      );
    },
    loading: (message: string, options?: { description?: string }) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      dispatch(
        showToast({
          id,
          type: "loading",
          message,
          description: options?.description,
        })
      );
      return id;
    },
    dismiss: (toastId?: string) => {
      if (toastId) {
        dispatch(dismissToast(toastId));
      } else {
        dispatch(dismissAllToasts(undefined));
        toast.dismiss();
      }
    },
    dismissLoading: () => {
      if (loadingToastId) {
        dispatch(dismissToast(loadingToastId));
      }
    },
  };

  return syncedToast;
};
