import { useState, useEffect } from "react";

export default function FocusModeToggle() {
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-focus-mode",
      focusMode ? "on" : "off"
    );
  }, [focusMode]);

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <span className="text-xs font-mono text-base-content/50 uppercase tracking-wider">
        Focus
      </span>
      <input
        type="checkbox"
        className="toggle toggle-xs"
        checked={focusMode}
        onChange={() => setFocusMode(!focusMode)}
        aria-label={focusMode ? "Show full screenshots" : "Crop to focal points"}
      />
    </label>
  );
}
