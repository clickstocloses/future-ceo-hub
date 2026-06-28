import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useUserStore, getLevelTitle, getLevelColor, getNextLevelXP, getCurrentLevelMinXP } from '@/stores/userStore';
import { supabase } from '@/integrations/supabase/client';
import { LevelBadge } from '@/components/LevelBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { XPProgressBadge } from '@/components/XPProgressBadge';
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  MessageSquare,
  Calendar,
  Award,
  User,
  LogOut,
  Menu,
  X,
  FileText,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/logo.png';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'Courses' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/community', icon: MessageSquare, label: 'Community' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/badges', icon: Award, label: 'Badges' },
  { to: '/ranks', icon: Shield, label: 'My Rank' },
  { to: '/sources', icon: FileText, label: 'Sources' },
];

import { Settings } from 'lucide-react';

export default function AppLayout() {
  const { profile } = useUserStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 border-r border-border bg-card/50">
        <div className="p-5 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logoImg} alt="Future CEO Lab" className="w-8 h-8 rounded-lg" />
            <span className="font-heading font-bold text-foreground">Future CEO Lab</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={`Navigate to ${item.label}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {profile && (
          <div className="p-4 border-t border-border space-y-3">
            <XPProgressBadge />
            <div className="flex items-center gap-3">
              <UserAvatar
                xp={profile.xp}
                avatarUrl={profile.avatar_url}
                username={profile.username}
                size={36}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{profile.full_name}</p>
                <LevelBadge xp={profile.xp} size="sm" />
              </div>
            </div>
            <Link
              to="/profile"
              className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 w-full px-3 py-2 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors"
            >
              <User className="w-4 h-4" />
              View Profile
            </Link>
            <div className="border-t border-border my-2" />
            <Link
              to="/settings"
              className={cn(
                'flex items-center gap-2 text-sm w-full px-3 py-2 rounded-lg transition-colors',
                location.pathname === '/settings'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              aria-label="Sign out of your account"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Header + Overlay */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card/50">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logoImg} alt="Future CEO Lab" className="w-7 h-7 rounded-lg" />
            <span className="font-heading font-bold text-foreground text-sm">Future CEO Lab</span>
          </Link>
          <div className="flex items-center gap-2">
            {profile && <XPProgressBadge compact />}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-foreground" aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm pt-16">
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-all',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="border-t border-border my-2 mx-4" />
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-all',
                  location.pathname === '/settings'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-base text-muted-foreground hover:text-foreground w-full hover:bg-muted/50"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
