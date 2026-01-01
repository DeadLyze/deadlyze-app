import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

function LaunchHeader() {
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [displayText, setDisplayText] = useState("ЗАПУСТИТЬ DEADLOCK");
  const [isRecoveringColor, setIsRecoveringColor] = useState(false);

  const originalText = "ЗАПУСТИТЬ DEADLOCK";
  const COOLDOWN_DURATION = 5000;
  const PAUSE_AFTER_GLITCH = 500;
  const COLOR_RECOVERY_DURATION = 600;
  const BUTTON_READY_BUFFER = 200;
  const GLITCH_END_BEFORE = PAUSE_AFTER_GLITCH + COLOR_RECOVERY_DURATION + BUTTON_READY_BUFFER;
  const GLITCH_DURATION = COOLDOWN_DURATION - GLITCH_END_BEFORE;

  useEffect(() => {
    if (!isLaunching) {
      setDisplayText(originalText);
      setIsRecoveringColor(false);
      return;
    }

    const chars = ['·', '-', '·'];
    const textArray = originalText.split('');
    const textLength = textArray.filter(c => c !== ' ').length;
    const waveLength = textLength + 5;
    
    const frameTime = 60;
    const totalFrames = Math.floor(GLITCH_DURATION / frameTime);
    const cyclesNeeded = Math.ceil(totalFrames / waveLength);
    const adjustedFrameTime = GLITCH_DURATION / (cyclesNeeded * waveLength);
    
    let frame = 0;

    const interval = setInterval(() => {
      if (frame * adjustedFrameTime >= GLITCH_DURATION) {
        setDisplayText(originalText);
        clearInterval(interval);
        return;
      }

      const wavePosition = frame % waveLength;

      const result = textArray.map((char, index) => {
        if (char === ' ') return ' ';
        
        const distance = Math.abs(index - wavePosition);
        if (distance < 3) {
          const random = Math.random();
          if (random > 0.6) {
            return chars[Math.floor(Math.random() * chars.length)];
          }
        }
        return char;
      });

      setDisplayText(result.join(''));
      frame++;
    }, adjustedFrameTime);

    const colorRecoveryTimeout = setTimeout(() => {
      setIsRecoveringColor(true);
    }, GLITCH_DURATION + PAUSE_AFTER_GLITCH);

    return () => {
      clearInterval(interval);
      clearTimeout(colorRecoveryTimeout);
    };
  }, [isLaunching]);

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
    const interval = setInterval(checkGameStatus, 3000);

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
    }, 150);

    setTimeout(() => setIsSpinning(false), 3000);

    try {
      await invoke("launch_deadlock");
    } catch (error) {
      console.error("Failed to launch game:", error);
    }

    setTimeout(() => setIsLaunching(false), COOLDOWN_DURATION);
  };

  const handleMouseUp = () => {
    // Empty - logic moved to handleMouseDown
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
          filter: "drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.3)) drop-shadow(-1px -1px 2px rgba(255, 255, 255, 0.1))",
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
          onMouseUp={handleMouseUp}
          disabled={isGameRunning || isLaunching}
          className="flex items-center justify-end pr-6"
          style={{
            width: "350px",
            height: "85px",
            borderRadius: "42.5px",
            background: isLaunching && !isRecoveringColor ? "#1a1f25" : "#10262F",
            backgroundImage: isLaunching && !isRecoveringColor
              ? "linear-gradient(135deg, rgba(60, 65, 70, 0.3) 15%, rgba(30, 30, 35, 0) 85%)"
              : "linear-gradient(135deg, rgba(50, 194, 132, 0.26) 15%, rgba(40, 27, 101, 0) 85%)",
            pointerEvents: isGameRunning ? "none" : "auto",
            cursor: isLaunching ? "default" : "pointer",
            boxShadow: isPressed
              ? "inset 4px 4px 9px rgba(0, 0, 0, 0.3), inset -4px -4px 10px rgba(0, 0, 0, 0.4)"
              : "inset 4px 4px 7px rgba(255, 255, 255, 0.06), inset -4px -4px 7px rgba(0, 0, 0, 0.25)",
            filter: "drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.2)) drop-shadow(-0.5px -0.5px 1px rgba(255, 255, 255, 0.05))",
            transform: isPressed
              ? "translateY(2px) scale(0.98)"
              : "translateY(0) scale(1)",
            transition: isPressed
              ? "all 0.08s cubic-bezier(0.4, 0, 0.6, 1)"
              : isRecoveringColor
              ? `all ${COLOR_RECOVERY_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`
              : "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <span
            style={{
              color: isLaunching && !isRecoveringColor ? "#b0b5ba" : "#E6CA9C",
              fontSize: "20px",
              fontWeight: 900,
              letterSpacing: "0.5px",
              transition: isRecoveringColor 
                ? `color ${COLOR_RECOVERY_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`
                : "color 0.08s ease-out",
            }}
          >
            {displayText}
          </span>
        </button>
      </div>
    </div>
  );
}

export default LaunchHeader;
