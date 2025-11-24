"use client";
import { useCallback, useMemo, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { Coin1, SearchNormal1, Clock } from "iconsax-react";

import { type Token } from "@/types";
import { truncateAddress, isTestnetChain, formatBalance } from "@/utils/utils";
import { CHAIN_CONFIG } from "@/utils/constants";
import { useWalletTokens, useTokenSearch, useRecentSearches } from "@/hooks";

import ShimmerAnimation from "@/components/ui/ShimmerAnimation";
import { TokenAvatar } from "@/components/main/token";
import Modal from "@/components/ui/Modal";

type TokenSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedToken?: Token | null;
  onTokenSelect: (token: Token) => void;
};

export default function TokenSelectModal({
  isOpen,
  onClose,
  selectedToken,
  onTokenSelect,
}: TokenSelectModalProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { tokens, isLoading } = useWalletTokens();
  const [searchInput, setSearchInput] = useState("");
  const {
    token: searchedToken,
    isLoading: isSearchLoading,
    isError: isSearchError,
    isManualSearch,
  } = useTokenSearch(searchInput, tokens);
  const { recentSearches, addRecentSearch } = useRecentSearches();

  const chainLogo = CHAIN_CONFIG[chainId].LOGO;
  const chainName = CHAIN_CONFIG[chainId].NAME;
  const isTestnet = isTestnetChain(chainId);

  const handleTokenSelect = useCallback(
    (token: Token, fromManualSearch: boolean = false) => {
      if (fromManualSearch) {
        addRecentSearch(token);
      }
      onTokenSelect(token);
      onClose();
      setSearchInput("");
    },
    [onTokenSelect, onClose, addRecentSearch]
  );

  const renderTokenItem = useCallback(
    (token: Token, fromManualSearch: boolean = false) => {
      const isSelected = selectedToken?.token_address === token.token_address;

      const formattedBalance = formatBalance(token.balance!, token.decimals);

      return (
        <div
          key={token.token_address}
          className={`flex items-center gap-3 p-2 rounded-xl transition cursor-pointer ${
            isSelected
              ? "bg-card border border-border-input"
              : "bg-transparent hover:bg-input-hover border border-transparent"
          }`}
          onClick={() => handleTokenSelect(token, fromManualSearch)}
        >
          <TokenAvatar
            token={token}
            size="md"
            chainLogo={chainLogo}
            isTestnet={isTestnet}
          />
          <div className="flex-1">
            <div className="font-semibold text-foreground">{token.symbol}</div>
            <div className="flex justify-start items-end gap-x-2">
              <span className="text-secondary text-sm">{token.name}</span>
              <span className="text-placeholder text-sm">
                {truncateAddress(token.token_address)}
              </span>
            </div>
          </div>
          {fromManualSearch && (
            <div className="text-right">
              <div className="text-foreground text-sm">
                {formattedBalance} {token.symbol}
              </div>
            </div>
          )}
        </div>
      );
    },
    [selectedToken, handleTokenSelect, chainLogo, isTestnet]
  );

  const tokenList = useMemo(() => {
    if (!tokens.length) return null;

    return tokens.map((token: Token) => renderTokenItem(token, false));
  }, [tokens, renderTokenItem]);

  const showSearchResult = searchInput.trim().length > 0;
  const showRecentSearches =
    !showSearchResult && recentSearches.length > 0 && isConnected;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select a Token">
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by contract address"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-input rounded-xl text-foreground placeholder:text-placeholder border border-transparent focus:border-border-input focus:outline-none transition"
          />
          <SearchNormal1
            size={18}
            color="#ffffff61"
            className="absolute right-3 top-1/2 -translate-y-1/2"
          />
        </div>

        {/* Content */}
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {!isConnected ? (
            <div className="text-secondary text-center py-8">
              Connect your wallet to view tokens
            </div>
          ) : showSearchResult ? (
            <>
              {isSearchLoading ? (
                <ShimmerAnimation showBalance />
              ) : isSearchError || !searchedToken ? (
                <div className="text-center py-8 space-y-1">
                  <div className="text-foreground font-medium">
                    Token Not Found
                  </div>
                  <div className="text-secondary text-sm">
                    No valid ERC-20 token exists at this address on {chainName}
                  </div>
                </div>
              ) : (
                <>{renderTokenItem(searchedToken, isManualSearch)}</>
              )}
            </>
          ) : (
            <>
              {showRecentSearches && (
                <>
                  <div className="flex items-center gap-x-2 mb-2">
                    <Clock size={18} color="#ffffffa6" />
                    <p className="text-secondary font-medium">
                      Recent Searches
                    </p>
                  </div>
                  {recentSearches.map((token) => renderTokenItem(token, false))}
                  <div className="h-4" />
                </>
              )}

              {isLoading ? (
                <>
                  <ShimmerAnimation />
                  <ShimmerAnimation />
                </>
              ) : !tokens.length ? (
                <div className="text-secondary text-center py-4">
                  No tokens found
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-x-2 mb-2">
                    <Coin1 size={18} color="#ffffffa6" />
                    <p className="text-secondary font-medium">Your Tokens</p>
                  </div>
                  {tokenList}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
