"use client";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, Theme } from "@rainbow-me/rainbowkit";
import { Provider as ReduxProvider } from "react-redux";
import { Toaster } from "sonner";

import { config } from "@/config/wagmi";
import { store } from "@/store";

type ProviderProps = {
  children: React.ReactNode;
};

const queryClient = new QueryClient();

const customTheme: Theme = {
  blurs: {
    modalOverlay: "blur(1px)",
  },
  colors: {
    accentColor: "#171eaa",
    accentColorForeground: "#ffffff",
    actionButtonBorder: "rgba(23, 30, 170, 0.2)",
    actionButtonBorderMobile: "rgba(23, 30, 170, 0.2)",
    actionButtonSecondaryBackground: "rgba(23, 30, 170, 0.12)",
    closeButton: "#A1A8B8",
    closeButtonBackground: "rgba(161, 168, 184, 0.1)",
    connectButtonBackground: "#171eaa",
    connectButtonBackgroundError: "#ef4444",
    connectButtonInnerBackground: "#171eaa",
    connectButtonText: "#ffffff",
    connectButtonTextError: "#ffffff",
    connectionIndicator: "#171eaa",
    downloadBottomCardBackground: "#171eaa",
    downloadTopCardBackground: "#171eaa",
    error: "#ef4444",
    generalBorder: "#1a1a1a",
    generalBorderDim: "rgba(26, 26, 26, 0.5)",
    menuItemBackground: "rgba(23, 30, 170, 0.15)",
    modalBackdrop: "rgba(0, 0, 0, 0.9)",
    modalBackground: "#000000",
    modalBorder: "#1a1a1a",
    modalText: "#ffffff",
    modalTextDim: "#A1A8B8",
    modalTextSecondary: "#6B7280",
    profileAction: "#0a0a0a",
    profileActionHover: "rgba(23, 30, 170, 0.2)",
    profileForeground: "#000000",
    selectedOptionBorder: "#171eaa",
    standby: "#cab1f4",
  },
  fonts: {
    body: "var(--font-dm-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  radii: {
    actionButton: "12px",
    connectButton: "16px",
    menuButton: "12px",
    modal: "24px",
    modalMobile: "24px",
  },
  shadows: {
    connectButton: "0 4px 12px rgba(23, 30, 170, 0.3)",
    dialog: "0 8px 32px rgba(0, 0, 0, 0.4)",
    profileDetailsAction: "0 2px 8px rgba(0, 0, 0, 0.2)",
    selectedOption: "0 0 0 2px #171eaa",
    selectedWallet: "0 0 0 2px #171eaa",
    walletLogo: "0 2px 8px rgba(23, 30, 170, 0.2)",
  },
};

const Providers = ({ children }: ProviderProps) => {
  return (
    <ReduxProvider store={store}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={customTheme}>
            <Toaster position="top-center" richColors />
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ReduxProvider>
  );
};

export default Providers;
