import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScreenReader } from "@/lib/screenReader";

type Prefs = {
  visuallyImpaired: boolean;
  auditoryImpaired: boolean;
  hasSetPreferences: boolean;
};

type Ctx = {
  preferences: Prefs;
  updatePreferences: (p: Partial<Prefs>) => Promise<void>;
  loading: boolean;
};

const DEFAULTS: Prefs = {
  visuallyImpaired: false,
  auditoryImpaired: false,
  hasSetPreferences: false,
};

const AccessibilityContext = createContext<Ctx | undefined>(undefined);

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPreferences(DEFAULTS);
        ScreenReader.disable();
        return;
      }

      const { data } = await supabase
        .from("user_accessibility_preferences" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        const next: Prefs = {
          visuallyImpaired: !!(data as any).visually_impaired,
          auditoryImpaired: !!(data as any).auditory_impaired,
          hasSetPreferences: !!(data as any).has_set_preferences,
        };
        setPreferences(next);
        if (next.visuallyImpaired) ScreenReader.enable();
        else ScreenReader.disable();
      } else {
        setPreferences(DEFAULTS);
        ScreenReader.disable();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, []);

  const updatePreferences = async (patch: Partial<Prefs>) => {
    const next = { ...preferences, ...patch };
    setPreferences(next);

    if (next.visuallyImpaired) ScreenReader.enable();
    else ScreenReader.disable();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("user_accessibility_preferences" as any)
      .upsert(
        {
          user_id: user.id,
          visually_impaired: next.visuallyImpaired,
          auditory_impaired: next.auditoryImpaired,
          has_set_preferences: next.hasSetPreferences,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (patch.visuallyImpaired === false && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <AccessibilityContext.Provider value={{ preferences, updatePreferences, loading }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
};
