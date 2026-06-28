import { useState, useEffect, useRef } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import { useSettings } from '@/contexts/SettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';
import { AvatarUpload } from '@/components/AvatarUpload';
import { LevelBadge } from '@/components/LevelBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  User, IdCard, Palette, Bell, Shield, BookOpen, Eye, AlertTriangle,
  Settings, ChevronDown, Check, Lock, Download, Trash2, Volume2
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type TabId = 'account' | 'profile' | 'appearance' | 'notifications' | 'privacy' | 'learning' | 'accessibility' | 'danger';

const tabs: { id: TabId; label: string; icon: any; danger?: boolean }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'profile', label: 'Profile', icon: IdCard },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'learning', label: 'Learning', icon: BookOpen },
  { id: 'accessibility', label: 'Accessibility', icon: Eye },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true },
];

// ─── Toggle Component ───
function SettingToggle({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 cursor-pointer group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )} />
      </button>
    </label>
  );
}

// ─── Section wrapper ───
function Section({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className="mb-8">
      <div className={cn("h-1 w-12 rounded mb-3", danger ? "bg-destructive" : "bg-primary")} />
      <h3 className={cn("text-base font-semibold mb-4", danger ? "text-destructive" : "text-foreground")}>{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

// ─── Danger action ───
function DangerAction({ title, description, buttonLabel, confirmWord, onConfirm }: {
  title: string; description: string; buttonLabel: string; confirmWord?: string; onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const needsConfirm = !!confirmWord;
  return (
    <div className="border border-destructive/30 rounded-lg p-4 mb-3">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
      {!open ? (
        <Button variant="outline" size="sm" className="mt-3 border-destructive text-destructive hover:bg-destructive/10" onClick={() => setOpen(true)}>
          {buttonLabel}
        </Button>
      ) : (
        <div className="mt-3 space-y-2">
          {needsConfirm && (
            <Input
              placeholder={`Type ${confirmWord} to confirm`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="max-w-xs"
            />
          )}
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={needsConfirm && input !== confirmWord}
              onClick={() => { onConfirm(); setOpen(false); setInput(''); }}
            >
              Confirm
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setInput(''); }}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════
export default function SettingsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const { profile, profileError, fetchProfile } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabId>('account');

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="card-surface max-w-md p-6 text-center">
          <h1 className="font-heading text-xl font-bold text-foreground">Settings unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {profileError || 'Your account profile could not be loaded. Refresh the page or sign out and back in.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Manage your account and preferences</p>

      {/* Mobile tab selector */}
      <div className="md:hidden mb-4">
        <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {tabs.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <span className={cn("flex items-center gap-2", t.danger && "text-destructive")}>
                  <t.icon className="w-4 h-4" /> {t.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-6">
        {/* Desktop tab list */}
        <nav className="hidden md:flex flex-col w-[200px] shrink-0 space-y-0.5">
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center gap-2 w-full text-left text-[13px] px-4 py-3 rounded-r-lg transition-colors border-l-[3px]",
                  active ? "bg-[hsl(var(--card))] border-l-primary text-foreground font-medium" : "border-l-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30",
                  t.danger && "text-destructive"
                )}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'account' && <AccountTab user={user} profile={profile} fetchProfile={fetchProfile} />}
          {activeTab === 'profile' && <ProfileTab user={user} profile={profile} fetchProfile={fetchProfile} />}
          {activeTab === 'appearance' && <AppearanceTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'privacy' && <PrivacyTab user={user} />}
          {activeTab === 'learning' && <LearningTab />}
          {activeTab === 'accessibility' && <AccessibilityTab />}
          {activeTab === 'danger' && <DangerTab user={user} />}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB 1 — ACCOUNT
// ═══════════════════════════════════════════
function AccountTab({ user, profile, fetchProfile }: { user: any; profile: any; fetchProfile: (id: string) => Promise<void> }) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [currentPwForEmail, setCurrentPwForEmail] = useState('');
  const [newUsername, setNewUsername] = useState(profile.username);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const checkUsername = async () => {
    const { data } = await supabase.from('profiles').select('id').eq('username', newUsername).neq('id', user.id);
    setUsernameAvailable(!data || data.length === 0);
  };

  const saveUsername = async () => {
    if (!usernameAvailable) return;
    const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', user.id);
    if (error) { toast.error('Failed to update username'); return; }
    toast.success('Username updated');
    await fetchProfile(user.id);
    setShowUsernameForm(false);
  };

  const updatePassword = async () => {
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated');
    setShowPasswordForm(false);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  const sendResetEmail = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email!, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { toast.error(error.message); return; }
    toast.success('Password reset email sent');
  };

  const signOutAll = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    toast.success('Signed out of all devices');
  };

  const pwStrength = newPw.length === 0 ? 0 : newPw.length < 6 ? 1 : newPw.length < 10 ? 2 : 3;
  const pwColors = ['', 'bg-destructive', 'bg-yellow-500', 'bg-green-500'];
  const pwLabels = ['', 'Weak', 'Fair', 'Strong'];

  return (
    <>
      <Section title="Account Details">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm text-foreground/60">{user.email}</p>
            {!showEmailForm ? (
              <Button variant="link" size="sm" className="px-0 h-auto text-xs" onClick={() => setShowEmailForm(true)}>Change email</Button>
            ) : (
              <div className="mt-2 space-y-2 max-w-sm">
                <Input placeholder="New email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                <Input placeholder="Confirm new email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} />
                <Input placeholder="Current password" type="password" value={currentPwForEmail} onChange={(e) => setCurrentPwForEmail(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" disabled={!newEmail || newEmail !== confirmEmail} onClick={async () => {
                    const { error } = await supabase.auth.updateUser({ email: newEmail });
                    if (error) toast.error(error.message); else { toast.success('Verification email sent'); setShowEmailForm(false); }
                  }}>Update email</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowEmailForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Username</p>
            <p className="text-sm text-foreground">{profile.username}</p>
            {!showUsernameForm ? (
              <Button variant="link" size="sm" className="px-0 h-auto text-xs" onClick={() => setShowUsernameForm(true)}>Change username</Button>
            ) : (
              <div className="mt-2 space-y-2 max-w-sm">
                <Input value={newUsername} onChange={(e) => { setNewUsername(e.target.value); setUsernameAvailable(null); }} />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={checkUsername}>Check availability</Button>
                  {usernameAvailable !== null && (
                    <span className={cn("text-xs flex items-center", usernameAvailable ? "text-green-500" : "text-destructive")}>
                      {usernameAvailable ? '✓ Available' : '✗ Taken'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={!usernameAvailable} onClick={saveUsername}>Save username</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowUsernameForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Account type</p>
            <p className="text-sm text-foreground capitalize">{profile.role}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Member since</p>
            <p className="text-sm text-foreground">{new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </Section>

      <Section title="Password">
        {!showPasswordForm ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
              <Lock className="w-4 h-4 mr-1" /> Change password
            </Button>
            <Button variant="ghost" size="sm" onClick={sendResetEmail}>Send password reset email</Button>
          </div>
        ) : (
          <div className="space-y-2 max-w-sm">
            <Input placeholder="Current password" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            <Input placeholder="New password" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            {newPw && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map((i) => <div key={i} className={cn("h-1 flex-1 rounded", i <= pwStrength ? pwColors[pwStrength] : "bg-muted")} />)}
                </div>
                <span className="text-xs text-muted-foreground">{pwLabels[pwStrength]}</span>
              </div>
            )}
            <Input placeholder="Confirm new password" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" onClick={updatePassword}>Update password</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Section>

      <Section title="Connected Accounts">
        <div className="space-y-3">
          {['Google', 'Apple'].map((provider) => (
            <div key={provider} className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">{provider}</span>
              <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">Coming soon</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sessions">
        <Button variant="outline" size="sm" onClick={signOutAll}>Sign out of all devices</Button>
        {profile.last_login && (
          <p className="text-xs text-muted-foreground mt-2">Last signed in: {new Date(profile.last_login).toLocaleString()}</p>
        )}
      </Section>
    </>
  );
}

// ═══════════════════════════════════════════
// TAB 2 — PROFILE
// ═══════════════════════════════════════════
function ProfileTab({ user, profile, fetchProfile }: { user: any; profile: any; fetchProfile: (id: string) => Promise<void> }) {
  const { settings, updateSetting } = useSettings();
  const [fullName, setFullName] = useState(profile.full_name);
  const [bio, setBio] = useState((profile as any).bio || '');
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName, bio }).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Failed to save'); return; }
    toast.success('Saved');
    await fetchProfile(user.id);
  };

  return (
    <>
      <Section title="Profile Photo">
        <AvatarUpload />
      </Section>

      <Section title="Display Information">
        <div className="space-y-3 max-w-sm">
          <div>
            <label className="text-xs text-muted-foreground">Full name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Bio / tagline</label>
            <Input value={bio} onChange={(e) => setBio(e.target.value.slice(0, 120))} maxLength={120} />
            <p className="text-xs text-muted-foreground mt-1">{bio.length}/120</p>
          </div>
          <Button size="sm" onClick={saveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </Section>

      <Section title="Profile Visibility">
        <SettingToggle label="Make my profile visible to other students" checked={settings.profileVisible} onChange={(v) => updateSetting('profileVisible', v)} />
        <SettingToggle label="Show my XP and rank on leaderboard" checked={settings.showXPOnLeaderboard} onChange={(v) => updateSetting('showXPOnLeaderboard', v)} />
        <SettingToggle label="Show my real name on leaderboard" description="When off, only your username is shown" checked={settings.showRealNameOnLeaderboard} onChange={(v) => updateSetting('showRealNameOnLeaderboard', v)} />
      </Section>
    </>
  );
}

// ═══════════════════════════════════════════
// TAB 3 — APPEARANCE
// ═══════════════════════════════════════════
function AppearanceTab() {
  const { settings, updateSetting } = useSettings();

  const themes = [
    { id: 'dark' as const, label: 'Dark', color: 'bg-[#0A0A0F]' },
    { id: 'light' as const, label: 'Light', color: 'bg-gray-100' },
    { id: 'system' as const, label: 'System', color: 'bg-gradient-to-r from-gray-100 to-[#0A0A0F]' },
  ];

  const accents = [
    { color: '#3B82F6', label: 'Blue' },
    { color: '#14B8A6', label: 'Teal' },
    { color: '#8B5CF6', label: 'Purple' },
    { color: '#F97316', label: 'Orange' },
    { color: '#10B981', label: 'Green' },
    { color: '#EF4444', label: 'Red' },
  ];

  return (
    <>
      <Section title="Theme">
        <div className="flex gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => updateSetting('theme', t.id)}
              className={cn(
                "w-24 h-16 rounded-lg border-2 transition-colors flex items-end justify-center pb-2",
                t.color,
                settings.theme === t.id ? "border-primary" : "border-border"
              )}
            >
              <span className="text-xs font-medium" style={{ color: t.id === 'light' ? '#000' : '#fff' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Accent Color">
        <div className="flex gap-3">
          {accents.map((a) => (
            <button
              key={a.color}
              onClick={() => updateSetting('accentColor', a.color)}
              className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center transition-transform hover:scale-110"
              style={{ backgroundColor: a.color }}
              title={a.label}
            >
              {settings.accentColor === a.color && <Check className="w-5 h-5 text-white" />}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Font Size">
        <div className="flex gap-2">
          {(['small', 'medium', 'large'] as const).map((s) => (
            <button
              key={s}
              onClick={() => updateSetting('fontSize', s)}
              className={cn(
                "px-4 py-2 rounded-full text-sm capitalize transition-colors",
                settings.fontSize === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Animations">
        <SettingToggle label="Enable animations and transitions" checked={settings.animationsEnabled} onChange={(v) => updateSetting('animationsEnabled', v)} />
      </Section>
    </>
  );
}

// ═══════════════════════════════════════════
// TAB 4 — NOTIFICATIONS
// ═══════════════════════════════════════════
function NotificationsTab() {
  const { settings, updateSetting } = useSettings();

  return (
    <>
      <Section title="Email Notifications">
        <SettingToggle label="New lesson available" checked={settings.notifNewLesson} onChange={(v) => updateSetting('notifNewLesson', v)} />
        <SettingToggle label="Weekly progress summary" checked={settings.notifWeeklySummary} onChange={(v) => updateSetting('notifWeeklySummary', v)} />
        <SettingToggle label="Streak reminder" checked={settings.notifStreakReminder} onChange={(v) => updateSetting('notifStreakReminder', v)} />
        <SettingToggle label="Badge earned notification" checked={settings.notifBadgeEarned} onChange={(v) => updateSetting('notifBadgeEarned', v)} />
        <SettingToggle label="Leaderboard rank change" checked={settings.notifRankChange} onChange={(v) => updateSetting('notifRankChange', v)} />
        <SettingToggle label="Community reply to your message" checked={settings.notifCommunityReply} onChange={(v) => updateSetting('notifCommunityReply', v)} />
        <SettingToggle label="New scheduled session available" checked={settings.notifNewSession} onChange={(v) => updateSetting('notifNewSession', v)} />
        <SettingToggle label="Platform announcements" checked={settings.notifAnnouncements} onChange={(v) => updateSetting('notifAnnouncements', v)} />
      </Section>

      <Section title="In-App Notifications">
        <SettingToggle label="Show notification bell" checked={settings.notifInappBell} onChange={(v) => updateSetting('notifInappBell', v)} />
        <SettingToggle label="Lesson completion celebration" checked={settings.notifInappCelebration} onChange={(v) => updateSetting('notifInappCelebration', v)} />
        <SettingToggle label="XP gain popup" checked={settings.notifInappXpPopup} onChange={(v) => updateSetting('notifInappXpPopup', v)} />
        <SettingToggle label="Streak update notification" checked={settings.notifInappStreak} onChange={(v) => updateSetting('notifInappStreak', v)} />
      </Section>

      <Section title="Notification Frequency">
        <div className="max-w-xs">
          <p className="text-xs text-muted-foreground mb-2">Email digest frequency</p>
          <Select value={settings.notifEmailFrequency} onValueChange={(v) => updateSetting('notifEmailFrequency', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="immediately">Immediately</SelectItem>
              <SelectItem value="daily">Daily summary</SelectItem>
              <SelectItem value="weekly">Weekly summary</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>
    </>
  );
}

// ═══════════════════════════════════════════
// TAB 5 — PRIVACY
// ═══════════════════════════════════════════
function PrivacyTab({ user }: { user: any }) {
  const { settings, updateSetting } = useSettings();
  const [deleteInput, setDeleteInput] = useState('');

  const downloadData = async () => {
    toast.info('Preparing your data download...');
    const [profileRes, xpRes, completionsRes, submissionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('user_xp_log').select('*').eq('user_id', user.id),
      supabase.from('lesson_completions').select('*').eq('user_id', user.id),
      supabase.from('offline_submissions').select('*').eq('user_id', user.id),
    ]);
    const data = { profile: profileRes.data, xp_log: xpRes.data, completions: completionsRes.data, submissions: submissionsRes.data };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'my-data.json'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Data downloaded');
  };

  return (
    <>
      <Section title="Data & Activity">
        <SettingToggle label="Show my online status in community chat" checked={settings.showOnlineStatus} onChange={(v) => updateSetting('showOnlineStatus', v)} />
      </Section>

      <Section title="Community">
        <SettingToggle label="Show level badge in community chat" checked={settings.showLevelBadgeInChat} onChange={(v) => updateSetting('showLevelBadgeInChat', v)} />
      </Section>

      <Section title="Data Download">
        <Button variant="outline" size="sm" onClick={downloadData}>
          <Download className="w-4 h-4 mr-1" /> Download my data
        </Button>
        <p className="text-xs text-muted-foreground mt-2">Your data will be downloaded as a JSON file.</p>
      </Section>

      <Section title="Account Deletion" danger>
        <DangerAction
          title="Delete my account"
          description="This will permanently delete your account, progress, XP, badges, and all submissions. This cannot be undone."
          buttonLabel="I want to delete my account"
          confirmWord="DELETE"
          onConfirm={() => toast.error('Account deletion requires admin approval. Please contact support.')}
        />
      </Section>
    </>
  );
}

// ═══════════════════════════════════════════
// TAB 6 — LEARNING
// ═══════════════════════════════════════════
function LearningTab() {
  const { settings, updateSetting, clearCEOHistory } = useSettings();

  return (
    <>
      <Section title="Learning Preferences">
        <SettingToggle label="Auto-play next lesson" checked={settings.autoPlayNext} onChange={(v) => updateSetting('autoPlayNext', v)} />
        <SettingToggle label="Show watch prompts before each video" checked={settings.showWatchPrompts} onChange={(v) => updateSetting('showWatchPrompts', v)} />
        <SettingToggle label="Require video before quiz is available" checked={settings.requireVideoBeforeQuiz} onChange={(v) => updateSetting('requireVideoBeforeQuiz', v)} />
        <SettingToggle label="Show XP earned after each quiz" checked={settings.showXPAfterQuiz} onChange={(v) => updateSetting('showXPAfterQuiz', v)} />
      </Section>

      <Section title="Quiz Settings">
        <SettingToggle label="Show explanations after answering" checked={settings.showQuizExplanations} onChange={(v) => updateSetting('showQuizExplanations', v)} />
        <SettingToggle label="Confirm before submitting quiz" checked={settings.confirmBeforeSubmit} onChange={(v) => updateSetting('confirmBeforeSubmit', v)} />
      </Section>

      <Section title="Progress & Streaks">
        <SettingToggle label="Show streak count on dashboard" checked={settings.showStreakOnDashboard} onChange={(v) => updateSetting('showStreakOnDashboard', v)} />
        <DangerAction
          title="Reset my streak"
          description="This will reset your current streak to 0 and cannot be undone."
          buttonLabel="Reset streak"
          confirmWord="RESET"
          onConfirm={async () => {
            const { error } = await supabase.from('profiles').update({ streak: 0 }).eq('id', (await supabase.auth.getUser()).data.user?.id);
            if (error) toast.error('Failed to reset streak');
            else toast.success('Streak reset to 0');
          }}
        />
      </Section>

      <Section title="CEO Helper">
        <SettingToggle label="Show CEO Helper button on all pages" checked={settings.showCEOHelper} onChange={(v) => updateSetting('showCEOHelper', v)} />
        <div className="max-w-xs mt-2">
          <p className="text-xs text-muted-foreground mb-2">Daily message limit</p>
          <Select value={String(settings.ceoHelperDailyLimit)} onValueChange={(v) => updateSetting('ceoHelperDailyLimit', Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 messages</SelectItem>
              <SelectItem value="20">20 messages</SelectItem>
              <SelectItem value="30">30 messages</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => { clearCEOHistory(); toast.success('Conversation cleared'); }}>
          Clear CEO Helper conversation history
        </Button>
      </Section>
    </>
  );
}

// ═══════════════════════════════════════════
// TAB 7 — ACCESSIBILITY
// ═══════════════════════════════════════════
function AccessibilityTab() {
  const { settings, updateSetting } = useSettings();
  const isScreenReaderOn = settings.screenReaderEnabled === true;
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const handleScreenReaderToggle = (v: boolean) => {
    if (!speechSupported) {
      toast.error('Read-aloud is not supported in your current browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    updateSetting('screenReaderEnabled', v);
    if (v) {
      import('@/lib/screenReader').then(m => {
        m.ScreenReader.enable();
        m.speak("Screen reader enabled. Everything you hover over will now be read aloud.");
      });
    } else {
      import('@/lib/screenReader').then(m => {
        m.speak("Screen reader disabled. You can turn it back on here at any time.");
        setTimeout(() => m.ScreenReader.disable(), 3000);
      });
    }
  };

  const speedOptions = [
    { label: 'Slow', value: 0.7 },
    { label: 'Normal', value: 1.0 },
    { label: 'Fast', value: 1.4 },
  ];

  return (
    <>
      {/* Screen Reader — prominent first section */}
      <div className="mb-8">
        <div className="h-1 w-12 rounded mb-3 bg-primary" />
        <h3 className="text-base font-semibold mb-4 text-foreground">Screen Reader & Read Aloud</h3>
        <div className="space-y-1">
          {/* Large prominent toggle row */}
          <div className="py-4 px-4 -mx-4 rounded-lg bg-card/40">
            <label className="flex items-start justify-between gap-4 cursor-pointer group">
              <div className="flex gap-3 flex-1 min-w-0">
                <Volume2 className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-[15px] font-medium text-foreground">Read content aloud on hover</p>
                  <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                    When enabled, everything you hover over or focus on will be read aloud using your device's built-in text-to-speech. Designed for visually impaired students and anyone who prefers to listen while they learn.
                  </p>
                  {!speechSupported && (
                    <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Read-aloud is not supported in your current browser. For the best experience use Chrome, Edge, or Safari.
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isScreenReaderOn}
                aria-label={`Read content aloud on hover. Currently ${isScreenReaderOn ? 'on' : 'off'}`}
                disabled={!speechSupported}
                onClick={() => handleScreenReaderToggle(!isScreenReaderOn)}
                className={cn(
                  "relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors mt-1",
                  isScreenReaderOn ? "bg-primary" : "bg-[#374151]",
                  !speechSupported && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className={cn(
                  "pointer-events-none block h-6 w-6 rounded-full bg-background shadow-lg transition-transform",
                  isScreenReaderOn ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </label>
          </div>

          {/* Sub-controls — visible only when ON */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              isScreenReaderOn ? "max-h-[300px] opacity-100 mt-3" : "max-h-0 opacity-0"
            )}
          >
            <div className="border-l-[3px] border-primary pl-4 space-y-4 ml-2">
              {/* Speed selector */}
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Reading speed</p>
                <p className="text-xs text-muted-foreground mb-2">How fast the text is spoken aloud</p>
                <div className="flex gap-1 max-w-xs">
                  {speedOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        updateSetting('screenReaderSpeed', opt.value);
                        import('@/lib/screenReader').then(m => {
                          m.ScreenReader.setRate(opt.value);
                          m.speak("This is how the reading speed sounds now.");
                        });
                      }}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
                        settings.screenReaderSpeed === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                      )}
                    >
                      {opt.label} ({opt.value}x)
                    </button>
                  ))}
                </div>
              </div>

              {/* Test button */}
              <Button
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-lg py-2.5"
                onClick={() => {
                  import('@/lib/screenReader').then(m =>
                    m.speak("This is how Future CEO Lab reads content aloud. Hover over anything on this page to hear it spoken.")
                  );
                }}
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Test read-aloud
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border mb-8" />

      <Section title="Display">
        <SettingToggle label="Reduce motion (disable animations)" checked={settings.reducedMotion} onChange={(v) => updateSetting('reducedMotion', v)} />
        <SettingToggle label="High contrast mode" checked={settings.highContrast} onChange={(v) => updateSetting('highContrast', v)} />
        <SettingToggle label="Larger click targets" checked={settings.largerClickTargets} onChange={(v) => updateSetting('largerClickTargets', v)} />
        <div className="max-w-xs mt-2">
          <p className="text-xs text-muted-foreground mb-2">Line spacing</p>
          <Select value={settings.lineSpacing} onValueChange={(v) => updateSetting('lineSpacing', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="relaxed">Relaxed</SelectItem>
              <SelectItem value="extra">Extra relaxed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Section title="Reading">
        <SettingToggle label="Underline all links" checked={settings.underlineLinks} onChange={(v) => updateSetting('underlineLinks', v)} />
        <SettingToggle label="Show focus indicators (keyboard navigation)" checked={settings.showFocusIndicators} onChange={(v) => updateSetting('showFocusIndicators', v)} />
        <div className="max-w-xs mt-2">
          <p className="text-xs text-muted-foreground mb-2">Font family</p>
          <Select value={settings.fontFamily} onValueChange={(v) => updateSetting('fontFamily', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (Inter)</SelectItem>
              <SelectItem value="dyslexic">Dyslexia-friendly (OpenDyslexic)</SelectItem>
              <SelectItem value="mono">Monospace</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>
    </>
  );
}

// ═══════════════════════════════════════════
// TAB 8 — DANGER ZONE
// ═══════════════════════════════════════════
function DangerTab({ user }: { user: any }) {
  return (
    <>
      <Section title="Danger Zone" danger>
        <DangerAction
          title="Reset all learning progress"
          description="This will delete all completed lessons, quiz scores, and XP. Your account will remain but your progress starts over."
          buttonLabel="Reset progress"
          confirmWord="RESET"
          onConfirm={async () => {
            await Promise.all([
              supabase.from('lesson_completions').delete().eq('user_id', user.id),
              supabase.from('user_xp_log').delete().eq('user_id', user.id),
              supabase.from('offline_submissions').delete().eq('user_id', user.id),
              supabase.from('profiles').update({ xp: 0, streak: 0 }).eq('id', user.id),
            ]);
            toast.success('All progress has been reset');
          }}
        />
        <DangerAction
          title="Reset all badges"
          description="Remove all earned badges from your account. This cannot be undone."
          buttonLabel="Reset badges"
          confirmWord="RESET"
          onConfirm={async () => {
            await supabase.from('user_badges').delete().eq('user_id', user.id);
            toast.success('All badges removed');
          }}
        />
        <DangerAction
          title="Leave all community channels"
          description="Remove yourself from all community discussions. You can rejoin anytime."
          buttonLabel="Leave all channels"
          onConfirm={async () => {
            await supabase.from('community_messages').delete().eq('user_id', user.id);
            toast.success('Left all community channels');
          }}
        />
        <DangerAction
          title="Delete account"
          description="This will permanently delete your account, progress, XP, badges, and all submissions. This cannot be undone."
          buttonLabel="Delete my account"
          confirmWord="DELETE"
          onConfirm={() => toast.error('Account deletion requires admin approval. Please contact support.')}
        />
      </Section>
    </>
  );
}
