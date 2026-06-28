import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRequireAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SchedulePage() {
  const { user: authUser, loading: authLoading } = useRequireAuth();
  const { user } = useUserStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [calMonth, setCalMonth] = useState(new Date());

  useEffect(() => {
    if (authLoading) return;
    if (!user && !authUser) {
      setLoading(false);
      return;
    }
    const activeUser = user || authUser;
    if (!activeUser) return;
    const fetch = async () => {
      try {
        const [sessionsRes, regsRes] = await Promise.all([
          supabase.from('schedule_sessions').select('*, modules(title)').order('starts_at'),
          supabase.from('session_registrations').select('session_id').eq('user_id', activeUser.id),
        ]);
        setSessions(sessionsRes.data || []);
        setRegistrations(new Set((regsRes.data || []).map(r => r.session_id)));
      } catch (error) {
        console.error('Schedule failed to load:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, authUser, authLoading]);

  const handleRegister = async (sessionId: string) => {
    if (!user) return;
    if (registrations.has(sessionId)) {
      await supabase.from('session_registrations').delete()
        .eq('session_id', sessionId)
        .eq('user_id', user.id);
      setRegistrations(prev => { const n = new Set(prev); n.delete(sessionId); return n; });
    } else {
      await supabase.from('session_registrations').insert({
        session_id: sessionId,
        user_id: user.id,
      });
      setRegistrations(prev => new Set(prev).add(sessionId));
    }
  };

  const filtered = sessions.filter(s => {
    if (filter === 'all') return true;
    return s.session_type === filter;
  });

  const typeColors: Record<string, string> = {
    'Live Tutoring': 'bg-primary/10 text-primary',
    'Group Study': 'bg-emerald-500/10 text-emerald-400',
    'Office Hours': 'bg-level-tycoon/10 text-level-tycoon',
  };

  // Calendar helpers
  const calYear = calMonth.getFullYear();
  const calMon = calMonth.getMonth();
  const firstDay = new Date(calYear, calMon, 1).getDay();
  const daysInMonth = new Date(calYear, calMon + 1, 0).getDate();
  const today = new Date();

  const sessionsByDate: Record<string, any[]> = {};
  filtered.forEach(s => {
    const d = new Date(s.starts_at);
    if (d.getMonth() === calMon && d.getFullYear() === calYear) {
      const key = d.getDate().toString();
      if (!sessionsByDate[key]) sessionsByDate[key] = [];
      sessionsByDate[key].push(s);
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Schedule</h1>
          <p className="text-sm text-muted-foreground">Live tutoring & group study sessions</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'Live Tutoring', 'Group Study', 'Office Hours'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            {f === 'all' ? 'All Sessions' : f}
          </button>
        ))}
      </div>

      {view === 'list' ? (
        /* List View */
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No sessions found</div>
          )}
          {filtered.map((s, i) => {
            const isRegistered = registrations.has(s.id);
            const startDate = new Date(s.starts_at);
            const isPast = startDate < new Date();

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`card-surface p-5 ${isPast ? 'opacity-50' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[s.session_type] || 'bg-muted text-muted-foreground'}`}>
                        {s.session_type}
                      </span>
                      {s.modules?.title && (
                        <span className="text-xs text-muted-foreground">{s.modules.title}</span>
                      )}
                    </div>
                    <h3 className="font-heading font-bold text-foreground">{s.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes}m
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {s.host_name}
                      </span>
                    </div>
                  </div>
                  {!isPast && (
                    <button
                      onClick={() => handleRegister(s.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                        isRegistered
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {isRegistered ? 'Registered ✓' : 'Register'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Calendar View */
        <div className="card-surface p-4 sm:p-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCalMonth(new Date(calYear, calMon - 1, 1))}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-heading font-bold text-foreground">
              {calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => setCalMonth(new Date(calYear, calMon + 1, 1))}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] rounded-lg" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const daySessions = sessionsByDate[day.toString()] || [];
              const isToday = today.getDate() === day && today.getMonth() === calMon && today.getFullYear() === calYear;

              return (
                <div
                  key={day}
                  className={`min-h-[80px] rounded-lg border p-1.5 transition-colors ${
                    isToday ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:bg-muted/20'
                  }`}
                >
                  <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {daySessions.slice(0, 2).map(s => {
                      const isRegistered = registrations.has(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => handleRegister(s.id)}
                          className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate transition-colors ${
                            isRegistered
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : typeColors[s.session_type]?.replace('text-', 'text-') || 'bg-muted text-muted-foreground'
                          }`}
                          title={`${s.title} — ${new Date(s.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        >
                          {new Date(s.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} {s.title}
                        </button>
                      );
                    })}
                    {daySessions.length > 2 && (
                      <span className="text-[10px] text-muted-foreground px-1">+{daySessions.length - 2} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* My Registrations summary */}
          {sessions.filter(s => registrations.has(s.id) && new Date(s.starts_at) >= new Date()).length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="font-heading font-bold text-foreground text-sm mb-3">Your Upcoming Sessions</h3>
              <div className="space-y-2">
                {sessions
                  .filter(s => registrations.has(s.id) && new Date(s.starts_at) >= new Date())
                  .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
                  .map(s => {
                    const startDate = new Date(s.starts_at);
                    return (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[s.session_type] || 'bg-muted text-muted-foreground'}`}>
                          {s.session_type}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
