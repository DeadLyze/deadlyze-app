import { useState, useEffect, useRef } from "react";

interface ShortcutInputProps {
  value: string;
  onChange: (shortcut: string) => void;
  onBlur?: (shortcut?: string) => void;
  onFocus?: () => void;
}

const CODE_TO_KEY: Record<string, string> = {
  ControlLeft: "Ctrl",
  ControlRight: "Ctrl",
  AltLeft: "Alt",
  AltRight: "Alt",
  ShiftLeft: "Shift",
  ShiftRight: "Shift",
  MetaLeft: "Win",
  MetaRight: "Win",
  Space: "Space",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Backquote: "`",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
};

// Modifiers that cannot be the last key in a shortcut
const MODIFIERS = ["Ctrl", "Alt", "Shift", "Win"];

function ShortcutInput({
  value,
  onChange,
  onBlur,
  onFocus,
}: ShortcutInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const normalizeCode = (code: string): string => {
    if (CODE_TO_KEY[code]) {
      return CODE_TO_KEY[code];
    }
    if (code.startsWith("Key")) {
      return code.replace("Key", "");
    }
    if (code.startsWith("Digit")) {
      return code.replace("Digit", "");
    }
    if (code.startsWith("Numpad")) {
      return "Num" + code.replace("Numpad", "");
    }
    return code;
  };

  // Validates if the shortcut is valid
  const isValidShortcut = (keys: string[]): boolean => {
    if (keys.length === 0) return false;
    const lastKey = keys[keys.length - 1];
    // Last key must not be a modifier
    return !MODIFIERS.includes(lastKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();
    e.stopPropagation();

    const normalizedKey = normalizeCode(e.code);

    if (pressedKeys.length < 3 && !pressedKeys.includes(normalizedKey)) {
      const newKeys = [...pressedKeys, normalizedKey];
      setPressedKeys(newKeys);
      setDisplayValue(newKeys.join("+"));

      if (newKeys.length === 3) {
        // Validate before completing
        if (isValidShortcut(newKeys)) {
          const shortcut = newKeys.join("+");
          onChange(shortcut);
          setIsRecording(false);
          setPressedKeys([]);
          inputRef.current?.blur();
        }
        // If invalid, just display but don't complete input
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (!isRecording || pressedKeys.length === 0) return;

    e.preventDefault();
    e.stopPropagation();

    const normalizedKey = normalizeCode(e.code);

    if (pressedKeys.includes(normalizedKey) && pressedKeys.length > 0) {
      const shortcut = pressedKeys.join("+");

      // Validate shortcut
      if (!isValidShortcut(pressedKeys)) {
        // Invalid shortcut - reset to previous value
        setIsRecording(false);
        setPressedKeys([]);
        setDisplayValue(value);
        inputRef.current?.blur();
        return;
      }

      if (shortcut !== value) {
        onChange(shortcut);
        setDisplayValue(shortcut);
        setIsRecording(false);
        setPressedKeys([]);
        onBlur?.(shortcut);
        inputRef.current?.blur();
      } else {
        // Even if shortcut didn't change, call onBlur
        // to re-enable shortcut handling
        setIsRecording(false);
        setPressedKeys([]);
        setDisplayValue(value);
        onBlur?.(value);
        inputRef.current?.blur();
      }
    }
  };

  const handleFocus = () => {
    onFocus?.();
    setIsRecording(true);
    setPressedKeys([]);
    setDisplayValue("...");
  };

  const handleBlur = () => {
    setIsRecording(false);
    setPressedKeys([]);
    setDisplayValue(value);
    // Call onBlur without parameter to re-enable shortcuts
    // (even if user just clicked outside the field)
    onBlur?.();
  };

  return (
    <div
      ref={inputRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="px-4 py-2 rounded cursor-pointer transition-opacity hover:opacity-80 outline-none"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        border: isRecording
          ? "1px solid rgba(33, 194, 113, 0.5)"
          : "1px solid rgba(255, 255, 255, 0.15)",
        color: isRecording ? "#21C271" : "#C5C5C5",
        fontSize: "14px",
        fontWeight: 400,
        minWidth: "140px",
        textAlign: "center",
      }}
    >
      {displayValue}
    </div>
  );
}

export default ShortcutInput;
