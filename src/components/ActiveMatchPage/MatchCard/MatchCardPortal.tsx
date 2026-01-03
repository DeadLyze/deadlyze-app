import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMatchCard } from "./MatchCardContext";
import { MatchCard } from "./MatchCard";

export const MatchCardPortal: React.FC = () => {
  const { cardData } = useMatchCard();
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!cardData?.triggerElement) return;

    const updatePosition = () => {
      if (!cardData?.triggerElement) return;

      const triggerRect = cardData.triggerElement.getBoundingClientRect();

      const left = triggerRect.right;
      let top;

      if (cardData.position === "top") {
        top = triggerRect.top;
      } else {
        const cardElement = document.querySelector(".match-card");
        const cardHeight = cardElement
          ? cardElement.getBoundingClientRect().height
          : 400;
        top = triggerRect.bottom - cardHeight;
      }

      setCardPosition({ top, left });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [cardData]);

  if (!cardData) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: cardPosition.top,
        left: cardPosition.left,
        zIndex: 99999,
        pointerEvents: "none",
      }}
    >
      <MatchCard
        match={cardData.match}
        heroIconUrl={cardData.heroIconUrl}
        position={cardData.position}
        visible={true}
      />
    </div>,
    document.body
  );
};
