import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRequireAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import { motion } from 'framer-motion';
import { Lock, BookOpen, CheckCircle2 } from 'lucide-react';

export default function CoursesPage() {
  const { user: authUser, loading: authLoading } = useRequireAuth();
  const { user } = useUserStore();
  const [modules, setModules] = useState<any[]>([]);
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [completionCounts, setCompletionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

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
        const [modsRes, lessonsRes, completionsRes] = await Promise.all([
          supabase.from('modules').select('*').order('order_index'),
          supabase.from('lessons').select('id, module_id'),
          supabase.from('lesson_completions').select('lesson_id').eq('user_id', activeUser.id),
        ]);

        const lessons = lessonsRes.data || [];
        setModules(modsRes.data || []);

        const counts: Record<string, number> = {};
        lessons.forEach((l: any) => {
          counts[l.module_id] = (counts[l.module_id] || 0) + 1;
        });
        setLessonCounts(counts);

        const completedIds = new Set((completionsRes.data || []).map((c: any) => c.lesson_id));
        const compCounts: Record<string, number> = {};
        lessons.forEach((l: any) => {
          if (completedIds.has(l.id)) {
            compCounts[l.module_id] = (compCounts[l.module_id] || 0) + 1;
          }
        });
        setCompletionCounts(compCounts);
      } catch (error) {
        console.error('Courses failed to load:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, authUser, authLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Check which modules are unlocked (sequential)
  const isModuleUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevModule = modules[index - 1];
    if (!prevModule) return false;
    const prevTotal = lessonCounts[prevModule.id] || 0;
    const prevCompleted = completionCounts[prevModule.id] || 0;
    return prevCompleted >= prevTotal && prevTotal > 0;
  };

  const getStatus = (moduleId: string, unlocked: boolean) => {
    if (!unlocked) return 'Locked';
    const total = lessonCounts[moduleId] || 0;
    const completed = completionCounts[moduleId] || 0;
    if (completed >= total && total > 0) return 'Completed';
    if (completed > 0) return 'In Progress';
    return 'Not Started';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">Course Library</h1>
      <p className="text-muted-foreground mb-8">6 modules to master the entrepreneurial journey</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod, i) => {
          const unlocked = isModuleUnlocked(i);
          const total = lessonCounts[mod.id] || 0;
          const completed = completionCounts[mod.id] || 0;
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
          const status = getStatus(mod.id, unlocked);

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.2, 0, 0, 1] }}
            >
              {unlocked ? (
                <Link to={`/courses/${mod.id}`} className="block">
                  <div className="card-surface-hover p-6 h-full">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-heading font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Module {mod.order_index}
                      </span>
                      <StatusBadge status={status} />
                    </div>
                    <h3 className="font-heading font-bold text-foreground mb-2">{mod.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{mod.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{total} lessons</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{percent}% complete</p>
                  </div>
                </Link>
              ) : (
                <div className="card-surface p-6 h-full opacity-60 relative">
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-heading font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      Module {mod.order_index}
                    </span>
                    <StatusBadge status="Locked" />
                  </div>
                  <h3 className="font-heading font-bold text-foreground mb-2">{mod.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{mod.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{total} lessons</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Not Started': 'bg-muted text-muted-foreground',
    'In Progress': 'bg-primary/10 text-primary',
    'Completed': 'bg-emerald-500/10 text-emerald-400',
    'Locked': 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || ''}`}>
      {status === 'Completed' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
      {status}
    </span>
  );
}
