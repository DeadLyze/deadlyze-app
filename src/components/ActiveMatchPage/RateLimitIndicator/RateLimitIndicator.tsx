import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MatchHistoryService } from "../../../services/MatchHistoryService";

const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS: 10,
  RESTORE_INTERVAL_MS: 3 * 60 * 1000 + 3000, // 3 minutes + 3 seconds
} as const;

interface RateLimitIndicatorProps {
  className?: string;
}

function RateLimitIndicator({ className = "" }: RateLimitIndicatorProps) {
  const { t } = useTranslation();
  const [availableRequests, setAvailableRequests] = useState(
    MatchHistoryService.getAvailableRequests()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setAvailableRequests(MatchHistoryService.getAvailableRequests());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const percentage = (availableRequests / RATE_LIMIT_CONFIG.MAX_REQUESTS) * 100;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (availableRequests === 0) return "#c83c3c";
    if (availableRequests <= 3) return "#E6CA9C";
    return "#21C271";
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Label */}
      <div className="flex flex-col items-start gap-0.5">
        <span
          style={{
            color: "#9FA6AD",
            fontSize: "11px",
            fontWeight: 500,
            lineHeight: "1.2",
          }}
        >
          {t("activeMatch.rateLimit.available")}
        </span>
        <span
          style={{
            color: "#9FA6AD",
            fontSize: "11px",
            fontWeight: 500,
            lineHeight: "1.2",
          }}
        >
          {t("activeMatch.rateLimit.limit")}
        </span>
      </div>

      {/* Circular Progress */}
      <div className="relative" style={{ width: "64px", height: "64px" }}>
        <svg
          className="transform -rotate-90"
          width="64"
          height="64"
          style={{
            filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))",
          }}
        >
          {/* Background circle */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="5"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke={getColor()}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease",
            }}
          />
        </svg>
        {/* Center text */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            top: 0,
            left: 0,
            width: "64px",
            height: "64px",
          }}
        >
          <span
            style={{
              color: getColor(),
              fontSize: "24px",
              fontWeight: 900,
              textShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
            }}
          >
            {availableRequests}
          </span>
        </div>
      </div>
    </div>
  );
}

export default RateLimitIndicator;
