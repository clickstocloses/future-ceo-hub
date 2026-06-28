import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/userStore';

export interface AppSettings {
  // Appearance
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  animationsEnabled: boolean;
  // Accessibility
  screenReaderEnabled: boolean | null;
  screenReaderSpeed: number;
  highContrast: boolean;
  reducedMotion: boolean;
  largerClickTargets: boolean;
  lineSpacing: 'normal' | 'relaxed' | 'extra';
  underlineLinks: boolean;
  showFocusIndicators: boolean;
  fontFamily: 'default' | 'dyslexic' | 'mono';
  // Learning
  autoPlayNext: boolean;
  showWatchPrompts: boolean;
  requireVideoBeforeQuiz: boolean;
  showXPAfterQuiz: boolean;
  showQuizExplanations: boolean;
  confirmBeforeSubmit: boolean;
  showStreakOnDashboard: boolean;
  // CEO Helper
  showCEOHelper: boolean;
  ceoHelperDailyLimit: number;
  // Privacy
  profileVisible: boolean;
  showXPOnLeaderboard: boolean;
  showRealNameOnLeaderboard: boolean;
  showOnlineStatus: boolean;
  showLevelBadgeInChat: boolean;
  // Notifications (stored in notification_preferences)
  notifNewLesson: boolean;
  notifWeeklySummary: boolean;
  notifStreakReminder: boolean;
  notifBadgeEarned: boolean;
  notifRankChange: boolean;
  notifCommunityReply: boolean;
  notifNewSession: boolean;
  notifAnnouncements: boolean;
  notifEmailFrequency: string;
  notifInappBell: boolean;
  notifInappCelebration: boolean;
  notifInappXpPopup: boolean;
  notifInappStreak: boolean;
}

const defaults: AppSettings = {
  theme: 'dark',
  accentColor: '#3B82F6',
  fontSize: 'medium',
  animationsEnabled: true,
  screenReaderEnabled: null,
  screenReaderSpeed: 1.0,
  highContrast: false,
  reducedMotion: false,
  largerClickTargets: false,
  lineSpacing: 'normal',
  underlineLinks: false,
  showFocusIndicators: true,
  fontFamily: 'default',
  autoPlayNext: false,
  showWatchPrompts: true,
  requireVideoBeforeQuiz: true,
  showXPAfterQuiz: true,
  showQuizExplanations: true,
  confirmBeforeSubmit: false,
  showStreakOnDashboard: true,
  showCEOHelper: true,
  ceoHelperDailyLimit: 20,
  profileVisible: true,
  showXPOnLeaderboard: true,
  showRealNameOnLeaderboard: false,
  showOnlineStatus: true,
  showLevelBadgeInChat: true,
  notifNewLesson: true,
  notifWeeklySummary: true,
  notifStreakReminder: true,
  notifBadgeEarned: true,
  notifRankChange: true,
  notifCommunityReply: true,
  notifNewSession: true,
  notifAnnouncements: true,
  notifEmailFrequency: 'daily',
  notifInappBell: true,
  notifInappCelebration: true,
  notifInappXpPopup: true,
  notifInappStreak: true,
};

interface SettingsContextValue {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  loaded: boolean;
  clearCEOHistory: () => void;
  ceoHistoryCleared: number; // counter to signal clears
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaults,
  updateSetting: () => {},
  loaded: false,
  clearCEOHistory: () => {},
  ceoHistoryCleared: 0,
});

export const useSettings = () => useContext(SettingsContext);

// Maps settings keys to profile column names
const profileColumns: Record<string, string> = {
  theme: 'preferred_theme',
  accentColor: 'preferred_accent',
  fontSize: 'preferred_font_size',
  profileVisible: 'profile_visible',
  screenReaderEnabled: 'screen_reader_enabled',
  screenReaderSpeed: 'screen_reader_speed',
};

// Maps settings keys to notification_preferences columns
const notifColumns: Record<string, string> = {
  notifNewLesson: 'new_lesson',
  notifWeeklySummary: 'weekly_summary',
  notifStreakReminder: 'streak_reminder',
  notifBadgeEarned: 'badge_earned',
  notifRankChange: 'rank_change',
  notifCommunityReply: 'community_reply',
  notifNewSession: 'new_session',
  notifAnnouncements: 'announcements',
  notifEmailFrequency: 'email_frequency',
  notifInappBell: 'inapp_bell',
  notifInappCelebration: 'inapp_celebration',
  notifInappXpPopup: 'inapp_xp_popup',
  notifInappStreak: 'inapp_streak',
};

// Helper: hex to HSL string "H S% L%"
function hexToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyThemeCSS(settings: AppSettings) {
  const root = document.documentElement;
  const styleId = 'settings-dynamic-styles';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  // Determine effective theme
  let effectiveTheme = settings.theme;
  if (effectiveTheme === 'system') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Apply theme class
  if (effectiveTheme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }

  // Accent color as HSL
  const accentHSL = hexToHSL(settings.accentColor);
  root.style.setProperty('--primary', accentHSL);
  root.style.setProperty('--ring', accentHSL);
  root.style.setProperty('--sidebar-primary', accentHSL);
  root.style.setProperty('--sidebar-ring', accentHSL);

  // Font size
  const fontSizes = { small: '13px', medium: '15px', large: '17px' };
  root.style.fontSize = fontSizes[settings.fontSize];

  // Line spacing
  const lineHeights = { normal: '1.5', relaxed: '1.8', extra: '2.2' };
  root.style.setProperty('--line-height-body', lineHeights[settings.lineSpacing]);

  // Font family
  const fontFamilies = {
    default: "'Inter', sans-serif",
    dyslexic: "'OpenDyslexic', sans-serif",
    mono: "'Courier New', monospace",
  };
  root.style.setProperty('--font-body', fontFamilies[settings.fontFamily]);

  // Build injected styles
  const rules: string[] = [];

  // Animations / reduced motion
  if (!settings.animationsEnabled || settings.reducedMotion) {
    rules.push(`*, *::before, *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
    }`);
  }

  // High contrast
  if (settings.highContrast) {
    rules.push(`:root {
      --foreground: 0 0% 100%;
      --card: 0 0% 0%;
      --border: 0 0% 100%;
    }`);
    rules.push(`* { border-width: 2px; }`);
  }

  // Larger click targets
  if (settings.largerClickTargets) {
    rules.push(`button, a, input[type="checkbox"], input[type="radio"], select {
      min-height: 48px !important;
      min-width: 48px !important;
    }`);
  }

  // Underline links
  if (settings.underlineLinks) {
    rules.push(`a { text-decoration: underline !important; }`);
  }

  // Focus indicators
  if (settings.showFocusIndicators) {
    rules.push(`*:focus-visible {
      outline: 3px solid hsl(var(--primary)) !important;
      outline-offset: 2px !important;
    }`);
  } else {
    rules.push(`*:focus, *:focus-visible { outline: none !important; }`);
  }

  // Line height on body
  rules.push(`body { line-height: var(--line-height-body, 1.5); font-family: var(--font-body, 'Inter', sans-serif); }`);

  styleEl.textContent = rules.join('\n');

  // Load OpenDyslexic if needed
  if (settings.fontFamily === 'dyslexic') {
    if (!document.getElementById('opendyslexic-font')) {
      const link = document.createElement('link');
      link.id = 'opendyslexic-font';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.css';
      document.head.appendChild(link);
    }
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUserStore();
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [ceoHistoryCleared, setCeoHistoryCleared] = useState(0);
  const prevSettings = useRef<AppSettings>(defaults);

  // Load settings from Supabase
  useEffect(() => {
    if (!user) {
      setSettings(defaults);
      setLoaded(true);
      return;
    }

    const load = async () => {
      setLoaded(false);
      try {
        const [{ data: profile }, { data: notif }] = await Promise.all([
          supabase.from('profiles').select('preferred_theme, preferred_accent, preferred_font_size, profile_visible, screen_reader_enabled, screen_reader_speed').eq('id', user.id).maybeSingle(),
          supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle(),
        ]);

        // Load from localStorage for settings not in DB
        const stored = localStorage.getItem(`settings_${user.id}`);
        const local = stored ? JSON.parse(stored) : {};

        const merged: AppSettings = {
          ...defaults,
          ...local,
          theme: (profile?.preferred_theme as any) || defaults.theme,
          accentColor: profile?.preferred_accent || defaults.accentColor,
          fontSize: (profile?.preferred_font_size as any) || defaults.fontSize,
          profileVisible: profile?.profile_visible ?? defaults.profileVisible,
          screenReaderEnabled: (profile as any)?.screen_reader_enabled ?? defaults.screenReaderEnabled,
          screenReaderSpeed: (profile as any)?.screen_reader_speed ?? defaults.screenReaderSpeed,
        };

        if (notif) {
          merged.notifNewLesson = notif.new_lesson ?? defaults.notifNewLesson;
          merged.notifWeeklySummary = notif.weekly_summary ?? defaults.notifWeeklySummary;
          merged.notifStreakReminder = notif.streak_reminder ?? defaults.notifStreakReminder;
          merged.notifBadgeEarned = notif.badge_earned ?? defaults.notifBadgeEarned;
          merged.notifRankChange = notif.rank_change ?? defaults.notifRankChange;
          merged.notifCommunityReply = notif.community_reply ?? defaults.notifCommunityReply;
          merged.notifNewSession = notif.new_session ?? defaults.notifNewSession;
          merged.notifAnnouncements = notif.announcements ?? defaults.notifAnnouncements;
          merged.notifEmailFrequency = notif.email_frequency ?? defaults.notifEmailFrequency;
          merged.notifInappBell = notif.inapp_bell ?? defaults.notifInappBell;
          merged.notifInappCelebration = notif.inapp_celebration ?? defaults.notifInappCelebration;
          merged.notifInappXpPopup = notif.inapp_xp_popup ?? defaults.notifInappXpPopup;
          merged.notifInappStreak = notif.inapp_streak ?? defaults.notifInappStreak;
        }

        setSettings(merged);
        prevSettings.current = merged;
      } catch (error) {
        console.error('Settings failed to load:', error);
        setSettings(defaults);
        prevSettings.current = defaults;
      } finally {
        setLoaded(true);
      }
    };

    load();
  }, [user]);

  // Apply CSS whenever settings change
  useEffect(() => {
    applyThemeCSS(settings);
  }, [settings]);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeCSS(settings);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (!user) return;

    setSettings(prev => {
      const next = { ...prev, [key]: value };
      // Save non-DB settings to localStorage
      localStorage.setItem(`settings_${user.id}`, JSON.stringify(next));
      return next;
    });

    // Persist to Supabase
    const profileCol = profileColumns[key];
    const notifCol = notifColumns[key];

    if (profileCol) {
      supabase.from('profiles').update({ [profileCol]: value } as any).eq('id', user.id).then(({ error }) => {
        if (error) {
          // Revert
          setSettings(prev => ({ ...prev, [key]: prevSettings.current[key] }));
          import('sonner').then(m => m.toast.error('Failed to save setting'));
        } else {
          prevSettings.current = { ...prevSettings.current, [key]: value };
        }
      });
    } else if (notifCol) {
      supabase.from('notification_preferences').upsert({ user_id: user.id, [notifCol]: value } as any).then(({ error }) => {
        if (error) {
          setSettings(prev => ({ ...prev, [key]: prevSettings.current[key] }));
          import('sonner').then(m => m.toast.error('Failed to save setting'));
        } else {
          prevSettings.current = { ...prevSettings.current, [key]: value };
        }
      });
    } else {
      // Local-only setting, already saved to localStorage above
      prevSettings.current = { ...prevSettings.current, [key]: value };
    }
  }, [user]);

  const clearCEOHistory = useCallback(() => {
    setCeoHistoryCleared(c => c + 1);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, loaded, clearCEOHistory, ceoHistoryCleared }}>
      {children}
    </SettingsContext.Provider>
  );
}
