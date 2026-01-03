import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MdHistory, MdDelete } from "react-icons/md";
import {
  MatchHistoryService,
  MatchHistoryEntry,
} from "../../../services/MatchHistoryService";

interface MatchHistoryPanelProps {
  onSelectMatch: (matchId: string) => void;
}

function MatchHistoryPanel({ onSelectMatch }: MatchHistoryPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      setHistory(MatchHistoryService.getHistory());
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectMatch = (matchId: string) => {
    setIsOpen(false);
    onSelectMatch(matchId);
  };

  const handleClearHistory = () => {
    MatchHistoryService.clearHistory();
    setHistory([]);
  };

  const handleRemoveEntry = (matchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    MatchHistoryService.removeFromHistory(matchId);
    setHistory(MatchHistoryService.getHistory());
  };

  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t("activeMatch.history.justNow");
    if (minutes < 60)
      return t("activeMatch.history.minutesAgo", { count: minutes });
    if (hours < 24) return t("activeMatch.history.hoursAgo", { count: hours });
    return t("activeMatch.history.daysAgo", { count: days });
  };

  return (
    <div className="flex flex-col items-end gap-3">
      {/* History List */}
      {isOpen && history.length > 0 && (
        <div
          className="overflow-hidden"
          style={{
            maxHeight: "300px",
            width: "320px",
            backgroundColor: "rgba(16, 38, 47, 0.95)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <span
              style={{
                color: "#E6CA9C",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.3px",
              }}
            >
              {t("activeMatch.history.title")}
            </span>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="transition-opacity hover:opacity-70"
                style={{
                  color: "#9FA6AD",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                {t("activeMatch.history.clearAll")}
              </button>
            )}
          </div>

          {/* History Items */}
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: "240px",
            }}
          >
            {history.map((entry) => (
              <div
                key={entry.matchId}
                onClick={() => handleSelectMatch(entry.matchId)}
                className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(33, 194, 113, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    style={{
                      color: "#E0E0E0",
                      fontSize: "16px",
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {entry.matchId}
                  </span>
                  <span
                    style={{
                      color: "#9FA6AD",
                      fontSize: "12px",
                      fontWeight: 400,
                    }}
                  >
                    {getRelativeTime(entry.timestamp)}
                  </span>
                </div>
                <button
                  onClick={(e) => handleRemoveEntry(entry.matchId, e)}
                  className="transition-opacity hover:opacity-100"
                  style={{
                    opacity: 0.5,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px",
                    color: "#9FA6AD",
                  }}
                >
                  <MdDelete size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Button */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 transition-all"
        style={{
          backgroundColor: isOpen
            ? "rgba(33, 194, 113, 0.15)"
            : "rgba(16, 38, 47, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "10px",
          padding: "10px 16px",
          cursor: "pointer",
          boxShadow: isOpen
            ? "0 0 0 2px rgba(33, 194, 113, 0.2)"
            : "0 4px 12px rgba(0, 0, 0, 0.2)",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = "rgba(33, 194, 113, 0.1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = "rgba(16, 38, 47, 0.8)";
          }
        }}
      >
        <MdHistory
          size={20}
          style={{
            color: isOpen ? "#21C271" : "#9FA6AD",
          }}
        />
        <span
          style={{
            color: isOpen ? "#21C271" : "#E0E0E0",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {t("activeMatch.history.button")}
        </span>
      </button>
    </div>
  );
}

export default MatchHistoryPanel;
