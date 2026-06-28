import { useCallback, useEffect } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

export const useScreenReader = () => {
  const { preferences } = useAccessibility();
  const enabled = preferences.visuallyImpaired;

  const speak = useCallback((text: string) => {
    if (!enabled) return;
    if (!("speechSynthesis" in window)) return;
    if (!text?.trim()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  }, [enabled]);

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => { if (!enabled) stop(); }, [enabled, stop]);

  return { speak, stop, enabled };
};
