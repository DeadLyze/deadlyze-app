import { useState, useRef, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

interface MatchSearchInputProps {
  onSearch: (matchId: string) => void;
}

function MatchSearchInput({ onSearch }: MatchSearchInputProps) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState<string[]>(Array(8).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    const newValue = value.slice(-1);
    newDigits[index] = newValue;
    setDigits(newDigits);

    if (newValue && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && digits.every((d) => d !== "")) {
      handleSubmit();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 7) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "");
    const newDigits = [...digits];

    for (let i = 0; i < Math.min(pasteData.length, 8); i++) {
      newDigits[i] = pasteData[i];
    }

    setDigits(newDigits);
    const lastFilledIndex = Math.min(pasteData.length, 8) - 1;
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.select();
  };

  const handleSubmit = () => {
    const matchId = digits.join("");
    if (matchId.length === 8) {
      onSearch(matchId);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <style>
        {`
          .digit-input::selection {
            background: transparent;
            color: inherit;
          }
          .digit-input::-moz-selection {
            background: transparent;
            color: inherit;
          }
        `}
      </style>
      <div className="flex flex-col items-center gap-1">
        <h2
          className="text-center"
          style={{
            color: "#E0E0E0",
            fontSize: "38px",
            fontWeight: 900,
            letterSpacing: "1px",
          }}
        >
          {t("activeMatch.searchForm.title")}
        </h2>
        <p
          className="text-center"
          style={{
            color: "#9FA6AD",
            fontSize: "13px",
            fontWeight: 400,
          }}
        >
          {t("activeMatch.searchForm.subtitle")}
        </p>
      </div>
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                handleChange(index, target.value);
              }}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="text-center transition-all focus:outline-none digit-input"
              style={{
                width: "48px",
                height: "60px",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "2px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "8px",
                color: "#E0E0E0",
                fontSize: "24px",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                caretColor: "transparent",
              }}
              onFocus={(e) => {
                handleFocus(index);
                e.target.style.borderColor = "#21C271";
                e.target.style.boxShadow = "0 0 0 3px rgba(33, 194, 113, 0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
                e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
              }}
            />
          ))}
        </div>
        <button
          onClick={handleSubmit}
          disabled={digits.some((d) => d === "")}
          className="flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            width: "300px",
            height: "70px",
            borderRadius: "35px",
            background: "#10262F",
            backgroundImage:
              "linear-gradient(135deg, rgba(50, 194, 132, 0.26) 15%, rgba(40, 27, 101, 0) 85%)",
            cursor: digits.some((d) => d === "") ? "not-allowed" : "pointer",
            boxShadow:
              "inset 4px 4px 7px rgba(255, 255, 255, 0.06), inset -4px -4px 7px rgba(0, 0, 0, 0.25)",
            filter:
              "drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.2)) drop-shadow(-0.5px -0.5px 1px rgba(255, 255, 255, 0.05))",
            border: "none",
            transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onMouseDown={(e) => {
            if (!digits.some((d) => d === "")) {
              e.currentTarget.style.boxShadow =
                "inset 4px 4px 9px rgba(0, 0, 0, 0.5), inset -4px -4px 10px rgba(0, 0, 0, 0.6)";
              e.currentTarget.style.filter = "none";
              e.currentTarget.style.transform = "translateY(2px) scale(0.98)";
              e.currentTarget.style.transition =
                "all 0.08s cubic-bezier(0.4, 0, 0.6, 1)";
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.boxShadow =
              "inset 4px 4px 7px rgba(255, 255, 255, 0.06), inset -4px -4px 7px rgba(0, 0, 0, 0.25)";
            e.currentTarget.style.filter =
              "drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.2)) drop-shadow(-0.5px -0.5px 1px rgba(255, 255, 255, 0.05))";
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.transition =
              "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow =
              "inset 4px 4px 7px rgba(255, 255, 255, 0.06), inset -4px -4px 7px rgba(0, 0, 0, 0.25)";
            e.currentTarget.style.filter =
              "drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.2)) drop-shadow(-0.5px -0.5px 1px rgba(255, 255, 255, 0.05))";
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.transition =
              "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
          }}
        >
          <span
            style={{
              color: "#E6CA9C",
              fontSize: "18px",
              fontWeight: 900,
              letterSpacing: "0.5px",
            }}
          >
            {t("activeMatch.searchForm.searchButton")}
          </span>
        </button>
      </div>
    </div>
  );
}

export default MatchSearchInput;
