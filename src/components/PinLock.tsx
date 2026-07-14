import { useState } from "preact/hooks";

interface PinLockProps {
  expectedPin: string;
  onUnlock: () => void;
  isSetup: boolean;
  onSetupComplete: (pin: string) => void;
}

export function PinLock({ expectedPin, onUnlock, isSetup, onSetupComplete }: PinLockProps) {
  const [enteredPin, setEnteredPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [stage, setStage] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const handleDigit = (digit: string) => {
    setError(null);
    if (isSetup) {
      if (stage === "enter") {
        const next = enteredPin + digit;
        setEnteredPin(next);
        if (next.length >= 4) {
          setStage("confirm");
        }
      } else {
        const next = confirmPin + digit;
        setConfirmPin(next);
        if (next.length >= 4) {
          if (next === enteredPin) {
            onSetupComplete(next);
          } else {
            setError("PINs don't match. Try again.");
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setConfirmPin("");
            setStage("enter");
            setEnteredPin("");
          }
        }
      }
    } else {
      const next = enteredPin + digit;
      setEnteredPin(next);
      if (next.length >= expectedPin.length) {
        if (next === expectedPin) {
          onUnlock();
        } else {
          setError("Wrong PIN. Try again.");
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setEnteredPin("");
        }
      }
    }
  };

  const handleDelete = () => {
    if (stage === "confirm") {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setEnteredPin(enteredPin.slice(0, -1));
    }
    setError(null);
  };

  const displayPin = stage === "confirm" ? confirmPin : enteredPin;
  const targetLength = expectedPin.length || 4;

  return (
    <div class="sg-pin-lock">
      <div class="sg-pin-lock-content">
        <div class="sg-pin-lock-icon">🛡️</div>
        <div class="sg-pin-lock-title">
          {isSetup
            ? stage === "enter" ? "Create a PIN" : "Confirm your PIN"
            : "Enter PIN to unlock"}
        </div>
        <div class="sg-pin-lock-subtitle">
          {isSetup
            ? stage === "enter"
              ? "This protects your recordings from unauthorized access"
              : "Enter the same PIN again to confirm"
            : "StopGuard is locked"}
        </div>

        <div class={`sg-pin-dots ${shake ? "shake" : ""}`}>
          {Array.from({ length: targetLength }).map((_, i) => (
            <div
              key={i}
              class={`sg-pin-dot ${i < displayPin.length ? "filled" : ""}`}
            />
          ))}
        </div>

        {error && <div class="sg-pin-error">{error}</div>}

        <div class="sg-pin-keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button key={d} class="sg-pin-key" onClick={() => handleDigit(d)}>
              {d}
            </button>
          ))}
          <div class="sg-pin-key-spacer" />
          <button class="sg-pin-key" onClick={() => handleDigit("0")}>0</button>
          <button class="sg-pin-key sg-pin-delete" onClick={handleDelete}>
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
