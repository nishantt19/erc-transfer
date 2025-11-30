# ERC20 Transfer DApp

A production-ready, multi-chain decentralized application for transferring native tokens and ERC-20 tokens with advanced features including real-time gas estimation, transaction monitoring, speedup detection, and cross-tab synchronization.

## Overview

This application provides a seamless and intuitive interface for sending cryptocurrency tokens across multiple blockchain networks. Built with Next.js and Web3 technologies, the app enables users to transfer both native tokens (like ETH) and any ERC-20 token with enterprise-grade features. The application leverages real-time gas price data from Infura to provide accurate fee estimates, monitors transactions for confirmation status, and even detects when users speed up their transactions through wallet interfaces. State persistence ensures that users never lose their progress, with form data and transaction history synchronized across browser tabs and page reloads. The app integrates with popular wallets through RainbowKit, supports five major blockchain networks, and provides a polished user experience with smooth animations, loading states, and comprehensive error handling.

## Features

The application includes a comprehensive set of features designed to provide a professional token transfer experience. Users can select from their entire wallet token list, which is automatically fetched via the Moralis API with real-time USD valuations, or import custom tokens by entering a contract address. The token search functionality remembers recent searches in local storage for quick access. Amount input supports both manual entry and quick-select percentage buttons (25%, 50%, 75%, 100% of balance), with automatic maximum calculation that accounts for gas fees when sending native tokens.

Gas estimation runs automatically with a 300ms debounce whenever the amount or recipient changes, calculating the required gas with a configurable safety buffer to prevent transaction failures. The system fetches live gas prices from Infura every 12 seconds and validates that the user has sufficient balance to cover both the transfer amount and gas fees, displaying clear error messages when funds are insufficient. Network congestion analysis classifies the current state as low, medium, or high, helping users understand expected confirmation times.

Transaction monitoring begins immediately after submission, with the app polling the blockchain every 3 seconds to detect when the transaction is included in a block. The interface displays a pending state with the transaction hash (copyable to clipboard), estimated wait time, gas price information, and a direct link to the block explorer. The app watches for transaction replacements by monitoring nonce values across new blocks, automatically detecting when users speed up or cancel transactions through their wallet and updating the UI to show "Sped Up - Waiting for Confirmations" status.

Form validation uses Zod schemas to ensure all inputs are correct before submission, checking that a token is selected, the amount is a valid non-negative number, and the recipient address follows the correct Ethereum format. The validation provides real-time feedback with descriptive error messages. State persistence stores the entire form (selected token, amount, recipient) and transaction history in Redux with localStorage, using custom serialization to handle BigInt values. The redux-state-sync library broadcasts state changes across browser tabs, ensuring that if a user submits a transaction in one tab, all other tabs immediately reflect the pending status.

Upon transaction confirmation, the app calculates and displays the total completion time, shows the block number, and provides a success animation with transaction details. The success message auto-hides after 8 seconds, resetting the form for the next transfer. Throughout the entire flow, Sonner toast notifications provide async feedback for actions like copying transaction hashes, submission errors, and completion status, with notifications synchronized across tabs to prevent duplicates.

## Architecture Overview

### Custom Hooks

The application follows a modular hook-based architecture that separates concerns and promotes code reusability.

#### Form Management Hooks

**useTransferForm** serves as the main composition hook that brings together form validation, state management, and Redux synchronization. It returns a React Hook Form instance configured with Zod schema validation, providing a single interface for the TransferCard component to manage all form interactions.

**useFormState** manages the form values including selected token, transfer amount, and recipient address, synchronizing between Redux store and local React state. This dual-state approach ensures that form data persists across page reloads while maintaining React's reactive updates.

**useFormSync** watches React Hook Form values and dispatches actions to keep the Redux store in sync, ensuring that any changes made to the form are immediately persisted and broadcast to other tabs through redux-state-sync.

**useFormValidation** configures Zod validation rules for the form, requiring a selected token object, a non-negative number string for the amount, and a valid Ethereum address for the recipient. Validation errors are surfaced through React Hook Form's built-in error handling.

#### Token and Balance Hooks

**useWalletTokens** fetches all tokens from the connected wallet using the Moralis API via a Next.js API route. The hook polls for token data, includes the native token in the results, handles loading and error states gracefully, and supports a refetch trigger mechanism that updates when the user completes a transaction.

**useTokenSearch** provides debounced search functionality for importing tokens by contract address. With a 500ms delay, it validates the contract address format, queries the token metadata endpoint, and returns symbol, decimals, and name information while handling errors for invalid or non-existent contracts.

**useRecentSearches** manages a local storage cache of recently searched tokens, limiting the history to 5 items. New searches are added to the front of the list, and the hook provides retrieval functionality for displaying recent searches in the token modal.

**useTokenBalance** gets the balance for a specific token using Wagmi's balance hooks. It handles both native tokens and ERC-20 tokens automatically, returns formatted balance values with proper decimal handling, and supports custom decimal specifications.

#### Gas Estimation Hooks

**useGasEstimation** calculates the total gas required for a transfer by estimating the base gas units needed, adding a configurable safety buffer (10% or minimum 21,000 units), fetching current gas prices from Infura, and validating that the user's balance is sufficient to cover both the transfer amount and gas fees. The hook returns a gas error flag that triggers UI warnings when funds are insufficient.

**useGasEstimationEffect** triggers gas estimation in a debounced manner (300ms delay) whenever the amount or recipient address changes. This prevents excessive calculations during typing while ensuring estimates stay current. The hook manages a loading state that displays a shimmer animation in the UI.

**useGasMetrics** polls the Infura Gas API every 12 seconds when transaction is pending to fetch real-time low, medium, and high gas price estimates. The hook uses TanStack Query for intelligent caching and background refetching, handles API errors gracefully by falling back to cached data, and provides the gas metrics to both estimation and transaction monitoring hooks.

#### Transaction Hooks

**useTransactionStatus** polls the transaction receipt every 3 seconds after submission, checking if the transaction has been included in a block. Once detected, it extracts the block number and returns the inclusion status to trigger confirmation handling.

**useTransactionEstimation** calculates transaction cost and timing details using the current gas metrics. It computes the gas cost, estimates the confirmation wait time based on the selected gas priority tier (low/medium/high), and detects the gas tier from the current fee levels.

**useTransactionSubmit** handles the actual blockchain submission, determining whether to use sendTransaction for native tokens or writeContract with ERC-20 ABI for token transfers. The hook updates Redux state from "signing" to "pending" and provides comprehensive error handling.

**useTransactionHandlers** provides callbacks for the transaction lifecycle. The success handler dispatches a confirmation action with the block number and completion time, while the error handler resets the transaction state and shows an error toast notification. The handlers track the elapsed time from submission to confirmation.

**useTransactionMonitoring** orchestrates the pending transaction tracking by starting the status polling when a transaction hash exists, monitoring for block inclusion, triggering the confirmation handler when detected, and cleaning up polling intervals on component unmount.

**useTransactionReplacement** watches new blocks for transactions with the same nonce as the pending transaction. When detected, it identifies whether the transaction was sped up or canceled by comparing transaction hashes and updates the Redux state with a "wasReplaced" flag that triggers the "Sped Up" UI message.

**useToastSync** reads toast messages from the Redux store (which may have been added in another tab), displays them via Sonner, and marks them as shown to prevent duplicate notifications. The hook includes a 1-hour TTL check to automatically expire old toast messages.

### Components

#### Layout Components

**Providers** wraps the entire application with necessary context providers in the correct order. It includes the Redux store provider with persistence rehydration, Wagmi configuration for blockchain interactions, RainbowKit's wallet connection UI with custom dark theme, TanStack Query for server state management, and Sonner's Toaster component for notifications. This component ensures all child components have access to wallet state, Redux store, and query cache.

**Navbar** serves as the application header, displaying the app logo and the RainbowKit ConnectButton component. When a wallet is connected, it shows the wallet address and current chain name. The button provides access to wallet management including disconnection and account switching.

#### Main Components

**TransferCard** acts as the main orchestrator for the entire transfer flow. It composes all necessary hooks including form management, gas estimation, transaction submission, and monitoring. Based on the current transaction phase from Redux (idle, signing, pending, or confirmed), it renders different views: the main form for idle state, a "Confirm in Wallet" message during signing, the TransactionEstimation component for pending transactions, and the TransactionSuccess component for confirmed transactions. The component handles form submission by calling the appropriate transaction hook and manages loading states throughout.

**TransactionEstimation** displays comprehensive information about a pending transaction. It shows the current network congestion level visualized with color coding (green for low, yellow for medium, red for high), estimated wait time based on gas priority, the gas price being paid and its priority tier, and a pulsing border animation to indicate active pending status (yellow for pending, blue while waiting for confirmation and purple when transaction was sped up).

**TransactionSuccess** presents a success view after confirmation. It displays the amount and token symbol transferred, recipient address (with copy button), block number where the transaction was included, total completion time formatted as minutes and seconds (e.g., "2m 15s"), and a direct link to view the transaction on the block explorer.

#### Input Components

**TokenAmountInput** combines token selection and amount entry in a single component. It displays the currently selected token with its logo and symbol or a "Select token" prompt. The amount input field validates numeric input in real-time and shows the token balance below with USD value. Four percentage buttons (25%, 50%, 75%, 100%) allow quick selection of fractional amounts, with special handling for native tokens that accounts for gas fees in the maximum calculation. Clicking the token selector opens the TokenSelectModal.

**AddressInput** provides recipient address entry with real-time validation feedback. As the user types, it validates the address format using Zod and displays error messages if the format is incorrect.

#### Token Components

**TokenSelectModal** presents a full-screen modal for token selection with multiple sections. At the top, a search input allows users to enter a contract address to import custom tokens, with debounced search and loading states. Below that, a "Recent Searches" section shows the last 5 searched tokens with their metadata. The main section displays all wallet tokens fetched from Moralis, each showing the token logo, symbol, name, formatted contract address. The modal includes shimmer loading animations while data fetches and empty state messages when no tokens are found. Clicking outside the modal or on a token closes it, with the selected token being dispatched to Redux.

**TokenAvatar** renders token icons with graceful fallback handling. If a token logo URL is available, it displays the image. If no logo exists or the image fails to load, it generates a deterministic background based on the token symbol using a hash function, ensuring the same token always displays the same colors. This provides a consistent visual identity even for tokens without official logos.

#### Shared UI Components

**Modal** provides a reusable modal wrapper using Framer Motion for smooth animations.

**ShimmerAnimation** creates skeleton loading states with a smooth gradient shimmer effect. It's used while token data is fetching, providing visual feedback that content is loading without jarring layout shifts.

**Tooltip** displays additional information on hover.

**InputWrapper** ensures consistent styling across all form inputs. It renders a label, the input component passed as children, and error messages below when validation fails.

## State Management

The application uses Redux Toolkit for client state management with three main slices.

**transferFormSlice** manages form state including the currently selected token object with all metadata, the transfer amount as a string to preserve decimal precision, the recipient address, a refetch trigger timestamp that updates when transactions complete to refresh balances, a showGasError flag that controls visibility of insufficient funds warnings, and an isEstimating flag that displays loading states during gas calculation.

**transactionSlice** implements a state machine with four phases: idle (no transaction in progress), signing (awaiting wallet signature), pending (transaction submitted, awaiting confirmation), and confirmed (transaction included in block). Additional state includes the transaction hash, submission timestamp for completion time calculation, amount and recipient for display purposes, token symbol to show which token was transferred, estimation data including gas cost and wait time, a wasReplaced flag set when speedup is detected, the block number where the transaction was included, and the total completion time in seconds.

**toastSlice** manages toast notifications with an array of message objects. Each message includes a unique ID, message text, type (success, error, or loading), timestamp for expiry checking (1-hour TTL), and a shown flag that prevents displaying the same toast multiple times across tabs. Redux-state-sync broadcasts toast actions to all open tabs.

## API Routes

The application includes three Next.js API routes that proxy external APIs to keep credentials secure.

**tokens/route.ts** fetches all tokens for a given wallet address from the Moralis API. It accepts walletAddress and chainId as query parameters, maps the chainId to Moralis's chain identifier format, makes an authenticated request to Moralis's ERC-20 balances endpoint, and returns an array of tokens with balances, decimals, symbol, name, logo, and USD value.

**token-search/route.ts** retrieves metadata for a specific token contract. It accepts contractAddress and chainId as query parameters, queries the Moralis token metadata endpoint with authentication, and returns the token's symbol, decimals, and name. This route handles errors gracefully, returning appropriate status codes for invalid addresses or non-existent contracts.

**gas/route.ts** fetches real-time gas price estimates from the Infura Gas API. It accepts chainId as a query parameter, maps it to the appropriate network name for Infura's API, makes an authenticated request to the gas price endpoint, and returns low, medium, and high priority gas prices in Wei. The endpoint provides fresh data every time it's called, with TanStack Query handling caching on the client side.

## Tech Stack

- **Frontend Framework:** Next.js, TypeScript
- **Styling:** Tailwind CSS 4
- **Web3 Libraries:** Wagmi, Viem, RainbowKit
- **State Management:** Redux Toolkit, React Redux, redux-state-sync
- **Server State:** TanStack React Query
- **Forms and Validation:** React Hook Form 7.66.0 for form state management, Zod 4.1.12 for schema validation
- **UI Libraries:** Framer Motion, Sonner, React Icons, iconsax-react
- **API Integration:** Axios, Moralis API for token and balance data, Infura Gas API for real-time gas price estimates, Alchemy RPC for blockchain node access
