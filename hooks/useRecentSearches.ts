import { useState, useEffect, useCallback } from "react";
import { useChainId } from "wagmi";
import { type Token } from "@/types";

const MAX_RECENT_SEARCHES = 5;

type RecentSearchesStorage = {
  [chainId: number]: Token[];
};

const STORAGE_KEY = "erc20-transfer-recent-searches";

const loadRecentSearches = (): RecentSearchesStorage => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveRecentSearches = (searches: RecentSearchesStorage): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  } catch {}
};

export const useRecentSearches = () => {
  const chainId = useChainId();
  const [recentSearches, setRecentSearches] = useState<Token[]>([]);

  useEffect(() => {
    const allSearches = loadRecentSearches();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentSearches(allSearches[chainId] || []);
  }, [chainId]);

  const addRecentSearch = useCallback(
    (token: Token) => {
      const allSearches = loadRecentSearches();
      const chainSearches = allSearches[chainId] || [];

      const filtered = chainSearches.filter(
        (t) =>
          t.token_address.toLowerCase() !== token.token_address.toLowerCase()
      );

      const updated = [token, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      const newSearches = {
        ...allSearches,
        [chainId]: updated,
      };

      saveRecentSearches(newSearches);
      setRecentSearches(updated);
    },
    [chainId]
  );

  const clearRecentSearches = useCallback(() => {
    const allSearches = loadRecentSearches();
    const newSearches = {
      ...allSearches,
      [chainId]: [],
    };
    saveRecentSearches(newSearches);
    setRecentSearches([]);
  }, [chainId]);

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };
};
