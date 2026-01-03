import React, { createContext, useContext, useState, ReactNode } from "react";
import { MatchHistoryItem } from "../../../services/PlayerDataService";

interface MatchCardContextType {
  cardData: {
    match: MatchHistoryItem & { account_id: number };
    heroIconUrl: string | null;
    position: "top" | "bottom";
    triggerElement: HTMLElement | null;
  } | null;
  showCard: (data: {
    match: MatchHistoryItem & { account_id: number };
    heroIconUrl: string | null;
    position: "top" | "bottom";
    triggerElement: HTMLElement | null;
  }) => void;
  hideCard: () => void;
}

const MatchCardContext = createContext<MatchCardContextType | undefined>(
  undefined
);

export const useMatchCard = () => {
  const context = useContext(MatchCardContext);
  if (!context) {
    throw new Error("useMatchCard must be used within a MatchCardProvider");
  }
  return context;
};

export const MatchCardProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cardData, setCardData] =
    useState<MatchCardContextType["cardData"]>(null);

  const showCard = (data: MatchCardContextType["cardData"]) => {
    setCardData(data);
  };

  const hideCard = () => {
    setCardData(null);
  };

  return (
    <MatchCardContext.Provider value={{ cardData, showCard, hideCard }}>
      {children}
    </MatchCardContext.Provider>
  );
};
