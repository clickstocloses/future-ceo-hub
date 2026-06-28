import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRequireAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Clock, Zap, ArrowLeft } from 'lucide-react';

export default function ModulePage() {
  const { user: authUser, loading: authLoading } = useRequireAuth();
  const { user } = useUserStore();
  const { moduleId } = useParams();
  const [moduleData, setModuleData] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user && !authUser) {
      setLoading(false);
      return;
    }
    if (!moduleId) {
      setLoading(false);
      return;
    }
    const activeUser = user || authUser;
    if (!activeUser) return;
    const fetch = async () => {
      try {
        const [modRes, lessonsRes, completionsRes] = await Promise.all([
          supabase.from('modules').select('*').eq('id', moduleId).maybeSingle(),
          supabase.from('lessons').select('*').eq('module_id', moduleId).order('order_index'),
          supabase.from('lesson_completions').select('lesson_id').eq('user_id', activeUser.id),
        ]);

        setModuleData(modRes.data);
        setLessons(lessonsRes.data || []);
        setCompletedIds(new Set((completionsRes.data || []).map((c: any) => c.lesson_id)));
      } catch (error) {
        console.error('Module failed to load:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, authUser, authLoading, moduleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="card-surface max-w-md p-6 text-center">
          <h1 className="font-heading text-xl font-bold text-foreground">Module could not load</h1>
          <p className="mt-2 text-sm text-muted-foreground">Refresh the page or return to Courses.</p>
          <Link to="/courses" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">Back to Courses</Link>
        </div>
      </div>
    );
  }

  const isLessonUnlocked = (index: number) => {
    if (index === 0) return true;
    return completedIds.has(lessons[index - 1]?.id);
  };

  const totalXP = lessons.reduce((sum, l) => sum + l.xp_reward, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      <div className="mb-8">
        <span className="text-xs font-heading font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          Module {moduleData.order_index}
        </span>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mt-3 mb-2">{moduleData.title}</h1>
        <p className="text-muted-foreground">{moduleData.description}</p>
        <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-level-tycoon" /> {totalXP} XP available</span>
          <span>{lessons.length} lessons</span>
        </div>
      </div>

      <div className="space-y-3">
        {lessons.map((lesson, i) => {
          const unlocked = isLessonUnlocked(i);
          const completed = completedIds.has(lesson.id);

          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              {unlocked ? (
                <Link
                  to={`/courses/${moduleId}/lessons/${lesson.id}`}
                  className="block card-surface-hover p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-heading font-bold ${completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                      {completed ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{lesson.title}</p>
                      {lesson.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{lesson.subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {lesson.duration_minutes}m</span>
                      <span className="flex items-center gap-1 text-primary"><Zap className="w-3.5 h-3.5" /> +{lesson.xp_reward}</span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="card-surface p-4 opacity-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{lesson.title}</p>
                      {lesson.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{lesson.subtitle}</p>}
                    </div>
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
