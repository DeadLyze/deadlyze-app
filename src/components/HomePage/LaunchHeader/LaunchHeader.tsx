import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import {
  ANIMATION_TIMINGS,
  GAME_STATUS_CHECK_INTERVAL,
} from "../../../constants";
import { useGlitchEffect } from "../../../hooks";

const GLITCH_END_BEFORE =
  ANIMATION_TIMINGS.PAUSE_AFTER_GLITCH +
  ANIMATION_TIMINGS.COLOR_RECOVERY_DURATION +
  ANIMATION_TIMINGS.BUTTON_READY_BUFFER;

const GLITCH_DURATION = ANIMATION_TIMINGS.COOLDOWN_DURATION - GLITCH_END_BEFORE;

function LaunchHeader() {
  const { t, i18n } = useTranslation();
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [displayText, setDisplayText] = useState(t("home.launchButton"));
  const [isRecoveringColor, setIsRecoveringColor] = useState(false);

  const originalText = t("home.launchButton");
  const { startGlitch } = useGlitchEffect(GLITCH_DURATION);

  useEffect(() => {
    setDisplayText(t("home.launchButton"));
  }, [i18n.language, t]);

  useEffect(() => {
    if (!isLaunching) {
      setDisplayText(originalText);
      setIsRecoveringColor(false);
      return;
    }

    const cleanupGlitch = startGlitch(originalText, setDisplayText);

    const colorRecoveryTimeout = setTimeout(() => {
      setIsRecoveringColor(true);
    }, ANIMATION_TIMINGS.COOLDOWN_DURATION - ANIMATION_TIMINGS.COLOR_RECOVERY_DURATION);

    return () => {
      cleanupGlitch();
      clearTimeout(colorRecoveryTimeout);
    };
  }, [isLaunching, originalText]);

  useEffect(() => {
    const checkGameStatus = async () => {
      try {
        const running = await invoke<boolean>("is_deadlock_running");
        setIsGameRunning(running);
      } catch (error) {
        console.error("Failed to check game status:", error);
      }
    };

    checkGameStatus();
    const interval = setInterval(checkGameStatus, GAME_STATUS_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const handleMouseDown = async () => {
    if (isGameRunning || isLaunching) return;

    setIsPressed(true);
    setIsHolding(true);
    setIsLaunching(true);
    setIsSpinning(true);

    setTimeout(() => {
      setIsPressed(false);
      setIsHolding(false);
    }, ANIMATION_TIMINGS.BUTTON_PRESS_DURATION);

    setTimeout(
      () => setIsSpinning(false),
      ANIMATION_TIMINGS.LOGO_SPIN_DURATION
    );

    try {
      await invoke("launch_deadlock");
    } catch (error) {
      console.error("Failed to launch game:", error);
    }

    setTimeout(
      () => setIsLaunching(false),
      ANIMATION_TIMINGS.COOLDOWN_DURATION -
        ANIMATION_TIMINGS.BUTTON_READY_BUFFER
    );
  };

  return (
    <div
      className="flex flex-col items-center gap-6"
      style={{ width: "350px" }}
    >
      <style>
        {`
          @keyframes spin-decelerate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(1440deg); }
          }
          
          .logo-spin {
            animation: spin-decelerate 3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
          
          .launch-button {
            position: relative;
            overflow: hidden;
          }
          
          .launch-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(50, 194, 132, 0.26) 15%, rgba(16, 38, 47, 1) 85%);
            opacity: ${isRecoveringColor ? 1 : isLaunching ? 0 : 1};
            transition: opacity ${
              isRecoveringColor
                ? ANIMATION_TIMINGS.COLOR_RECOVERY_DURATION
                : 150
            }ms cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            z-index: 1;
            border-radius: 42.5px;
          }
          
          .launch-button::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            box-shadow: ${
              isPressed
                ? "inset 4px 4px 9px rgba(0, 0, 0, 0.3), inset -4px -4px 10px rgba(0, 0, 0, 0.4)"
                : "inset 4px 4px 7px rgba(255, 255, 255, 0.06), inset -4px -4px 7px rgba(0, 0, 0, 0.25)"
            };
            pointer-events: none;
            z-index: 2;
            border-radius: 42.5px;
            transition: box-shadow 0.08s cubic-bezier(0.4, 0, 0.6, 1);
          }
        `}
      </style>
      <h1
        className="text-[78px] font-[900] text-center"
        style={{
          background:
            "linear-gradient(135deg, #C0A777 0%, #24B584 65%, #1DA475 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: "1.1",
          filter:
            "drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.3)) drop-shadow(-1px -1px 2px rgba(255, 255, 255, 0.1))",
        }}
      >
        DeadLyze
      </h1>
      <div style={{ position: "relative", width: "350px", height: "85px" }}>
        <div
          style={{
            position: "absolute",
            left: "8.5px",
            top: "7.5px",
            width: "70px",
            height: "70px",
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "3px",
              top: "2.7px",
              width: "62px",
              height: "62px",
              borderRadius: "50%",
              boxShadow: isPressed ? "3px 3px 8px rgba(0, 0, 0, 0.5)" : "none",
              transition: "box-shadow 0.2s ease-out",
            }}
          />
          <img
            src="/assets/deadlock_logo.png"
            alt="Deadlock"
            className={isSpinning ? "logo-spin" : ""}
            style={{
              width: "70px",
              height: "70px",
              position: "relative",
              zIndex: 1,
              transform: isSpinning
                ? "rotate(0deg)"
                : `rotate(${isHovered && !isLaunching ? -15 : 0}deg) scale(${
                    isHolding ? 0.95 : 1
                  })`,
              transition: isSpinning
                ? "none"
                : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
        <button
          onMouseEnter={() => !isLaunching && setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            if (isPressed && !isLaunching) {
              setIsPressed(false);
              setIsHolding(false);
            }
          }}
          onMouseDown={handleMouseDown}
          disabled={isGameRunning || isLaunching}
          className="flex items-center launch-button"
          style={{
            width: "350px",
            height: "85px",
            borderRadius: "42.5px",
            background: "#1a1f25",
            backgroundImage:
              "linear-gradient(135deg, rgba(60, 65, 70, 0.3) 15%, rgba(30, 30, 35, 0) 85%)",
            pointerEvents: isGameRunning ? "none" : "auto",
            cursor: isLaunching ? "default" : "pointer",
            filter:
              "drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.2)) drop-shadow(-0.5px -0.5px 1px rgba(255, 255, 255, 0.05))",
            transform: isPressed
              ? "translateY(2px) scale(0.98)"
              : "translateY(0) scale(1)",
            transition: isPressed
              ? "all 0.08s cubic-bezier(0.4, 0, 0.6, 1)"
              : "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            paddingLeft: "72px",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              zIndex: 3,
            }}
          >
            <span
              style={{
                color:
                  isLaunching && !isRecoveringColor ? "#b0b5ba" : "#E6CA9C",
                fontSize: "20px",
                fontWeight: 900,
                letterSpacing: "0.5px",
                transition: isRecoveringColor
                  ? `color ${ANIMATION_TIMINGS.COLOR_RECOVERY_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`
                  : "color 0.08s ease-out",
              }}
            >
              {displayText}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

export default LaunchHeader;
