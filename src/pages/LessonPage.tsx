import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRequireAuth } from '@/hooks/useAuth';
import { checkAndAwardBadges } from '@/lib/badgeChecker';
import { useUserStore } from '@/stores/userStore';
import { motion, AnimatePresence } from 'framer-motion';
import ReactConfetti from 'react-confetti';
import PaperSubmission from '@/components/PaperSubmission';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Download, Eye, Zap, Clock,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

export default function LessonPage() {
  const { user: authUser, loading: authLoading } = useRequireAuth();
  const { user, addXP } = useUserStore();
  const { preferences: a11yPrefs } = useAccessibility();
  const { moduleId, lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<any>(null);
  const [moduleData, setModuleData] = useState<any>(null);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hadIncorrect, setHadIncorrect] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [openEndedAnswer, setOpenEndedAnswer] = useState('');
  const [gradingOpenEnded, setGradingOpenEnded] = useState(false);
  const [openEndedFeedback, setOpenEndedFeedback] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user && !authUser) {
      setLoading(false);
      return;
    }
    if (!lessonId || !moduleId) {
      setLoading(false);
      return;
    }
    const activeUser = user || authUser;
    if (!activeUser) return;
    const fetch = async () => {
      try {
        const [lessonRes, modRes, promptsRes, questionsRes, lessonsRes, compRes] = await Promise.all([
          supabase.from('lessons').select('*').eq('id', lessonId).maybeSingle(),
          supabase.from('modules').select('*').eq('id', moduleId).maybeSingle(),
          supabase.from('watch_prompts').select('*').eq('lesson_id', lessonId).order('order_index'),
          supabase.functions.invoke('quiz', { body: { action: 'get_questions', lesson_id: lessonId } }),
          supabase.from('lessons').select('id, title, order_index').eq('module_id', moduleId).order('order_index'),
          supabase.from('lesson_completions').select('*').eq('user_id', activeUser.id).eq('lesson_id', lessonId),
        ]);

        setLesson(lessonRes.data);
        setModuleData(modRes.data);
        setPrompts(promptsRes.data || []);
        setQuestions(((questionsRes.data as any)?.questions || []));
        setAllLessons(lessonsRes.data || []);
        setIsCompleted((compRes.data || []).length > 0);
      } catch (error) {
        console.error('Lesson failed to load:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, authUser, authLoading, lessonId, moduleId]);

  const isOpenEnded = (q: any) => q.is_open_ended === true;

  const handleAnswer = useCallback(async (index: number) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
    setShowFeedback(true);
    const q = questions[currentQ];
    const { data, error } = await supabase.functions.invoke('quiz', {
      body: {
        action: 'check_answer',
        question_id: q.id,
        answer_index: index,
      },
    });
    const row = data as any;
    const correct = !error && !!row?.correct;
    setIsCorrect(correct);
    if (!correct) setHadIncorrect(true);
    if (row) {
      setQuestions(prev => {
        const next = [...prev];
        next[currentQ] = { ...next[currentQ], correct_index: row.correct_index, explanation: row.explanation };
        return next;
      });
    }
  }, [showFeedback, currentQ, questions]);

  const handleOpenEndedSubmit = useCallback(async () => {
    if (showFeedback || !openEndedAnswer.trim() || gradingOpenEnded) return;
    setGradingOpenEnded(true);
    try {
      const { data, error } = await supabase.functions.invoke('grade-open-ended', {
        body: {
          question_text: questions[currentQ].question_text,
          student_answer: openEndedAnswer.trim(),
        },
      });
      if (error) throw error;
      const reasonable = data?.is_reasonable !== false;
      setIsCorrect(reasonable);
      setShowFeedback(true);
      setOpenEndedFeedback(data?.feedback || '');
      if (!reasonable) setHadIncorrect(true);
    } catch (e) {
      console.error('Open-ended grading error:', e);
      // Be lenient on error — pass the student
      setIsCorrect(true);
      setShowFeedback(true);
      setOpenEndedFeedback('Great effort on your answer!');
    } finally {
      setGradingOpenEnded(false);
    }
  }, [showFeedback, openEndedAnswer, gradingOpenEnded, currentQ, questions]);

  const handleNext = useCallback(async () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setOpenEndedAnswer('');
      setOpenEndedFeedback('');
    } else {
      // End of quiz
      setQuizComplete(true);
      if (!hadIncorrect) {
        setQuizPassed(true);
        setShowConfetti(true);
        
        if (!isCompleted) {
          const newAttempts = attempts + 1;
          await supabase.from('lesson_completions').insert({
            user_id: user!.id,
            lesson_id: lessonId!,
            attempts: newAttempts,
            first_attempt_perfect: newAttempts === 1,
          });

          await addXP(lesson.xp_reward, `Completed lesson: ${lesson.title}`);
          if (newAttempts === 1) {
            await addXP(25, 'First attempt perfect bonus');
          }
          setIsCompleted(true);

          // Check and award badges
          await checkAndAwardBadges(user!.id, lessonId!, moduleId!, newAttempts === 1);
        }

        setTimeout(() => setShowCompletionModal(true), 500);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  }, [currentQ, questions, hadIncorrect, isCompleted, attempts, user, lessonId, lesson, addXP]);

  const resetQuiz = () => {
    setCurrentQ(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setHadIncorrect(false);
    setQuizComplete(false);
    setQuizPassed(false);
    setAttempts(a => a + 1);
    setOpenEndedAnswer('');
    setOpenEndedFeedback('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lesson || !moduleData) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="card-surface max-w-md p-6 text-center">
          <h1 className="font-heading text-xl font-bold text-foreground">Lesson could not load</h1>
          <p className="mt-2 text-sm text-muted-foreground">Refresh the page or return to Courses.</p>
          <Link to="/courses" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">Back to Courses</Link>
        </div>
      </div>
    );
  }

  const currentIndex = allLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {showConfetti && <ReactConfetti recycle={false} numberOfPieces={300} />}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link to="/dashboard" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <Link to={`/courses/${moduleId}`} className="hover:text-foreground transition-colors">{moduleData.title}</Link>
        <span>/</span>
        <span className="text-foreground">{lesson.title}</span>
      </div>

      {/* Lesson Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap mb-2">
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Completed
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            <Zap className="w-3 h-3" /> +{lesson.xp_reward} XP
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" /> {lesson.duration_minutes} min
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">{lesson.title}</h1>
        {lesson.subtitle && <p className="text-muted-foreground mt-1">{lesson.subtitle}</p>}
      </div>

      {/* Video Embed */}
      {lesson.video_id && !lesson.video_id.startsWith('placeholder') && (
        <div className="mb-8">
          <div className="aspect-video rounded-xl overflow-hidden bg-card">
            <iframe
              src={`https://www.youtube.com/embed/${lesson.video_id}${a11yPrefs.auditoryImpaired ? '?cc_load_policy=1&cc_lang_pref=en&hl=en' : ''}`}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {lesson.video_id && lesson.video_id.startsWith('placeholder') && (
        <div className="mb-8 card-surface p-12 text-center rounded-xl">
          <p className="text-muted-foreground">Video coming soon</p>
        </div>
      )}

      {/* Watch Prompts */}
      {prompts.length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" /> Watch For
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {prompts.map((p) => (
              <div key={p.id} className="card-surface p-4">
                <p className="text-sm text-foreground">{p.prompt_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDF Download */}
      {lesson.pdf_url && lesson.pdf_url !== '#' && (
        <div className="mb-8 card-surface p-5 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-foreground">Lesson Resources</h3>
            <p className="text-sm text-muted-foreground mt-1">Download the lesson PDF</p>
          </div>
          <button
            onClick={async () => {
              try {
                const url = lesson.pdf_url as string;
                // Extract object path after the bucket name in the stored URL
                const marker = '/lesson-pdfs/';
                const idx = url.indexOf(marker);
                const path = idx >= 0 ? url.substring(idx + marker.length) : url;
                const { data, error } = await supabase.storage
                  .from('lesson-pdfs')
                  .createSignedUrl(decodeURIComponent(path), 60 * 10);
                if (error || !data?.signedUrl) throw error ?? new Error('No URL');
                window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
              } catch {
                toast.error('Could not open PDF');
              }
            }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Eye className="w-4 h-4" /> View PDF
          </button>
        </div>
      )}

      {lesson.pdf_url === '#' && (
        <div className="mb-8 card-surface p-5">
          <h3 className="font-heading font-bold text-foreground">Lesson Resources</h3>
          <p className="text-sm text-muted-foreground mt-1">PDF resources coming soon</p>
        </div>
      )}

      {/* Quiz */}
      {questions.length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-level-tycoon" /> Knowledge Check
          </h2>

          {!quizComplete ? (
            <div className="card-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
                <div className="flex gap-1">
                  {questions.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i === currentQ ? 'bg-primary' : i < currentQ ? 'bg-emerald-500' : 'bg-muted'}`} />
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQ}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="font-medium text-foreground mb-4">{questions[currentQ].question_text}</p>

                  {isOpenEnded(questions[currentQ]) ? (
                    <div className="space-y-3">
                      <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mb-1">
                        Open-ended answer
                      </span>
                      <textarea
                        value={openEndedAnswer}
                        onChange={(e) => setOpenEndedAnswer(e.target.value)}
                        disabled={showFeedback}
                        placeholder="Type your answer here..."
                        className="w-full min-h-[120px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      {!showFeedback && (
                        <button
                          onClick={handleOpenEndedSubmit}
                          disabled={!openEndedAnswer.trim() || gradingOpenEnded}
                          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {gradingOpenEnded ? (
                            <span className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                              Checking your answer...
                            </span>
                          ) : 'Submit Answer'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(questions[currentQ].options as string[]).map((opt: string, i: number) => {
                        let optClass = 'border-border hover:border-primary/50 hover:bg-primary/5';
                        if (showFeedback) {
                          if (i === questions[currentQ].correct_index) {
                            optClass = 'border-emerald-500/50 bg-emerald-500/10';
                          } else if (i === selectedAnswer && !isCorrect) {
                            optClass = 'border-red-500/50 bg-red-500/10 animate-[shake_0.3s_ease-in-out]';
                          }
                        } else if (i === selectedAnswer) {
                          optClass = 'border-primary bg-primary/10';
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => handleAnswer(i)}
                            disabled={showFeedback}
                            className={`w-full text-left p-3 rounded-lg border transition-all duration-200 text-sm ${optClass} active:scale-[0.98]`}
                          >
                            <span className="text-foreground">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      <p className={`text-sm ${isCorrect ? 'text-emerald-400' : 'text-red-400'} mb-2`}>
                        {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                      </p>
                      {isOpenEnded(questions[currentQ]) && openEndedFeedback && (
                        <p className="text-sm text-muted-foreground mb-2">{openEndedFeedback}</p>
                      )}
                      {!isOpenEnded(questions[currentQ]) && questions[currentQ].explanation && (
                        <p className="text-sm text-muted-foreground">{questions[currentQ].explanation}</p>
                      )}
                      <button
                        onClick={handleNext}
                        className="mt-3 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        {currentQ < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <div className="card-surface p-6 text-center">
              {quizPassed ? (
                <div>
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="font-heading font-bold text-foreground text-xl mb-2">Quiz Passed</h3>
                  <p className="text-muted-foreground">You answered all questions correctly.</p>
                </div>
              ) : (
                <div>
                  <h3 className="font-heading font-bold text-foreground text-xl mb-2">Almost There</h3>
                  <p className="text-muted-foreground mb-4">You must answer all questions correctly in one attempt. Try again!</p>
                  <button
                    onClick={resetQuiz}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Paper Submission Section */}
      <PaperSubmission
        lessonId={lessonId!}
        moduleId={moduleId!}
        pdfUrl={lesson.pdf_url}
        isCompletedOnline={isCompleted}
        questions={questions}
        onLessonCompleted={() => setIsCompleted(true)}
        nextLessonLink={nextLesson ? `/courses/${moduleId}/lessons/${nextLesson.id}` : null}
      />

      {/* Nav */}
      <div className="flex justify-between items-center pt-4 border-t border-border">
        {prevLesson ? (
          <Link
            to={`/courses/${moduleId}/lessons/${prevLesson.id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> {prevLesson.title}
          </Link>
        ) : <div />}
        {nextLesson ? (
          <Link
            to={`/courses/${moduleId}/lessons/${nextLesson.id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {nextLesson.title} <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            to="/courses"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            Back to Courses <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-surface p-8 max-w-sm w-full text-center"
          >
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="font-heading font-bold text-foreground text-2xl mb-2">Lesson Complete</h2>
            <p className="text-muted-foreground mb-2">{lesson.title}</p>
            <div className="flex justify-center gap-4 mb-6 text-sm">
              <span className="text-primary font-heading font-semibold">+{lesson.xp_reward} XP</span>
              {attempts === 0 && <span className="text-level-tycoon font-heading font-semibold">+25 Bonus XP</span>}
            </div>
            {nextLesson ? (
              <Link
                to={`/courses/${moduleId}/lessons/${nextLesson.id}`}
                onClick={() => setShowCompletionModal(false)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-heading font-semibold hover:bg-primary/90 transition-colors"
              >
                Next Lesson <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/courses"
                onClick={() => setShowCompletionModal(false)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-heading font-semibold hover:bg-primary/90 transition-colors"
              >
                Back to Courses
              </Link>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
