import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/userStore';
import { checkAndAwardBadges } from '@/lib/badgeChecker';
import { motion, AnimatePresence } from 'framer-motion';
import ReactConfetti from 'react-confetti';
import { Link } from 'react-router-dom';
import {
  Camera, Printer, CheckCircle2, Upload, AlertTriangle,
  Sun, Layout, Maximize2, PenTool, EyeOff, XCircle, Zap,
  ArrowRight, ChevronDown, ChevronUp, FileText,
} from 'lucide-react';

type SubmissionState =
  | 'empty'
  | 'preview'
  | 'uploading'
  | 'processing'
  | 'results'
  | 'image_unclear'
  | 'error';

interface GradingResult {
  question_number: number;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation?: string;
  short_answer_summary?: string;
}

interface GradingResponse {
  success: boolean;
  reason?: string;
  confidence?: string;
  results?: GradingResult[];
  score?: number;
  total?: number;
  passed?: boolean;
  image_url?: string;
}

interface PastSubmission {
  score: number;
  total: number;
  passed: boolean;
  ai_response: any;
  created_at: string;
  image_url: string;
}

const PROCESSING_MESSAGES = [
  'Reading your answers...',
  'Comparing to answer key...',
  'Calculating your score...',
  'Almost done...',
];

interface Props {
  lessonId: string;
  moduleId: string;
  pdfUrl: string | null;
  isCompletedOnline: boolean;
  questions: any[];
  onLessonCompleted: () => void;
  nextLessonLink?: string | null;
}

export default function PaperSubmission({
  lessonId, moduleId, pdfUrl, isCompletedOnline, questions, onLessonCompleted, nextLessonLink,
}: Props) {
  const { user, addXP } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<SubmissionState>('empty');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingMsg, setProcessingMsg] = useState(0);
  const [gradingResult, setGradingResult] = useState<GradingResponse | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Past submissions
  const [pastSubmission, setPastSubmission] = useState<PastSubmission | null>(null);
  const [showPastResults, setShowPastResults] = useState(false);
  const [loadingPast, setLoadingPast] = useState(true);

  // Fetch past submissions
  useEffect(() => {
    if (!user || !lessonId) return;
    const fetchPast = async () => {
      const { data } = await supabase
        .from('offline_submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setPastSubmission(data[0] as unknown as PastSubmission);
      }
      setLoadingPast(false);
    };
    fetchPast();
  }, [user, lessonId]);

  // Cycle processing messages
  useEffect(() => {
    if (state !== 'processing') return;
    const interval = setInterval(() => {
      setProcessingMsg((p) => (p + 1) % PROCESSING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [state]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File is too large. Maximum size is 10MB.');
      setState('error');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setState('preview');
  }, []);

  const resetUpload = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setState('empty');
    setGradingResult(null);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  const handleSubmit = useCallback(async () => {
    if (!selectedFile || !user) return;

    setState('uploading');
    setUploadProgress(0);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 15, 90));
      }, 200);

      setUploadProgress(90);
      setState('processing');
      setProcessingMsg(0);
      clearInterval(progressInterval);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('grade-paper-submission', {
        body: { image: base64, lesson_id: lessonId },
      });

      if (error) {
        throw new Error(error.message || 'Grading failed');
      }

      const result = data as GradingResponse;

      if (!result.success && result.reason === 'image_unclear') {
        setState('image_unclear');
        return;
      }

      if (!result.success) {
        throw new Error('Grading failed');
      }

      setGradingResult(result);
      setState('results');

      if (result.passed && !isCompletedOnline) {
        setShowConfetti(true);
        // Refresh profile XP
        if (user) {
          await addXP(0, ''); // Force profile refresh via store
        }
        onLessonCompleted();
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (e: any) {
      console.error('Submission error:', e);
      setErrorMsg(e.message || 'Something went wrong. Please try again.');
      setState('error');
    }
  }, [selectedFile, user, lessonId, isCompletedOnline, addXP, onLessonCompleted]);

  if (loadingPast) return null;
  if (questions.length === 0) return null;

  const scoreColor = (score: number) => {
    if (score >= 4) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score === 3) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  const renderScoreBadge = (score: number, total: number) => (
    <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${scoreColor(score)}`}>
      <span className="text-2xl font-heading font-bold">{score}/{total}</span>
    </div>
  );

  const renderResults = (result: GradingResponse, submittedAt?: string) => (
    <div className="space-y-6">
      {/* Score summary */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">{renderScoreBadge(result.score!, result.total!)}</div>
        <p className="text-foreground font-medium">You scored {result.score} out of {result.total}</p>
        <div className="flex items-center justify-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${result.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {result.passed ? 'Passed' : 'Not yet — try again'}
          </span>
          {result.score === 5 && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
              ⭐ Perfect score!
            </span>
          )}
        </div>
        {submittedAt && (
          <p className="text-xs text-muted-foreground">
            Submitted on {new Date(submittedAt).toLocaleDateString()} at {new Date(submittedAt).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-2">
        {(result.results || []).map((r, i) => (
          <div key={i} className="card-surface p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {r.is_correct ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Q{r.question_number}</p>
                {r.question_number === 5 ? (
                  <div className="mt-1 space-y-1">
                    {r.short_answer_summary && (
                      <p className="text-xs text-muted-foreground">Your response: {r.short_answer_summary}</p>
                    )}
                    <p className="text-xs text-muted-foreground italic">Full credit awarded for relevant responses</p>
                  </div>
                ) : r.is_correct ? (
                  <p className="text-xs text-emerald-400 mt-0.5">Correct</p>
                ) : (
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-red-400">You answered: {r.student_answer}</p>
                    <p className="text-xs text-emerald-400">Correct answer: {r.correct_answer}</p>
                    {r.explanation && (
                      <div className="bg-muted/50 rounded-md p-2 mt-1">
                        <p className="text-xs text-muted-foreground">{r.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {result.passed ? (
        <div className="space-y-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
            <p className="text-sm text-emerald-400">
              {isCompletedOnline
                ? 'Great job on the paper version! (Already completed online)'
                : 'Your paper submission has been recorded. This lesson is now marked complete.'}
            </p>
          </div>
          {nextLessonLink && !isCompletedOnline && (
            <Link
              to={nextLessonLink}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-heading font-semibold hover:bg-primary/90 transition-colors w-full justify-center"
            >
              Continue to next lesson <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
            <p className="text-sm text-amber-400">
              You need 4 out of 5 to pass. Review the questions you missed and try again.
            </p>
          </div>
          <button
            onClick={resetUpload}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors w-full"
          >
            Submit a new photo
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Or <Link to={`/courses/${moduleId}/lessons/${lessonId}#quiz`} className="text-primary hover:underline">complete the quiz online instead</Link>
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {showConfetti && <ReactConfetti recycle={false} numberOfPieces={300} />}

      {/* Divider */}
      <div className="flex items-center gap-3 my-8">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground font-medium">Completed on paper instead?</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Past submission banner */}
      {pastSubmission && state === 'empty' && (
        <div className={`mb-4 rounded-lg p-4 ${pastSubmission.passed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
          <div className="flex items-center justify-between">
            <p className={`text-sm ${pastSubmission.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
              {pastSubmission.passed
                ? `Paper worksheet submitted and graded on ${new Date(pastSubmission.created_at).toLocaleDateString()}`
                : `Last attempt: ${pastSubmission.score}/${pastSubmission.total} — try again below`}
            </p>
            {pastSubmission.passed && (
              <button
                onClick={() => setShowPastResults(!showPastResults)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {showPastResults ? 'Hide' : 'View'} results
                {showPastResults ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
          {showPastResults && pastSubmission.passed && pastSubmission.ai_response && (
            <div className="mt-4">
              {renderResults(
                { success: true, ...pastSubmission.ai_response, score: pastSubmission.score, total: pastSubmission.total, passed: pastSubmission.passed },
                pastSubmission.created_at,
              )}
            </div>
          )}
        </div>
      )}

      {isCompletedOnline && state === 'empty' && (
        <div className="mb-4 bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
          <p className="text-xs text-primary">Already completed online — submit for practice</p>
        </div>
      )}

      {/* Main card */}
      <div className="card-surface p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground">Submit your paper worksheet</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Completed the printed version? Upload a photo of your answers to get them graded instantly.
            </p>
          </div>
        </div>

        {/* 3 Steps */}
        {(state === 'empty' || state === 'preview') && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Printer, label: 'Download & complete the worksheet' },
              { icon: Camera, label: 'Take a clear photo of your answers' },
              { icon: CheckCircle2, label: 'Upload and get your grade' },
            ].map((step, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-muted/30">
                <step.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground leading-tight">{step.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* State: Empty */}
        {state === 'empty' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
            >
              <Camera className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Tap to upload your worksheet photo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, HEIC or WEBP — max 10MB</p>
            </button>
          </div>
        )}

        {/* State: Preview */}
        {state === 'preview' && previewUrl && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-border">
              <img src={previewUrl} alt="Worksheet preview" className="w-full max-h-96 object-contain bg-muted/20" />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" /> Submit for grading
              </button>
              <button onClick={resetUpload} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Choose a different photo
              </button>
            </div>
          </div>
        )}

        {/* State: Uploading */}
        {state === 'uploading' && (
          <div className="py-8 space-y-4">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">Uploading your photo...</p>
          </div>
        )}

        {/* State: Processing */}
        {state === 'processing' && (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <AnimatePresence mode="wait">
              <motion.p
                key={processingMsg}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-sm text-muted-foreground"
              >
                {PROCESSING_MESSAGES[processingMsg]}
              </motion.p>
            </AnimatePresence>
          </div>
        )}

        {/* State: Results */}
        {state === 'results' && gradingResult && (
          renderResults(gradingResult)
        )}

        {/* State: Image Unclear */}
        {state === 'image_unclear' && (
          <div className="space-y-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-foreground text-xl mb-1">We could not read your worksheet clearly</h3>
              <p className="text-muted-foreground text-sm">Your photo needs to be clearer for accurate grading</p>
            </div>

            <div className="space-y-3">
              {[
                { icon: Sun, text: 'Move to a well-lit area — natural light works best' },
                { icon: Layout, text: 'Lay the sheet flat on a table, not held in your hand' },
                { icon: Maximize2, text: 'Make sure all 5 questions fit inside the frame' },
                { icon: PenTool, text: 'Check that your circled answers are dark and clear' },
                { icon: EyeOff, text: 'Avoid shadows covering any part of the page' },
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <tip.icon className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span className="text-muted-foreground">{tip.text}</span>
                </div>
              ))}
            </div>

            {/* Good vs bad illustration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="w-16 h-20 mx-auto mb-2 rounded bg-white border-2 border-emerald-500/30 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-xs text-emerald-400 font-medium">Good ✓</p>
                <p className="text-xs text-muted-foreground">Flat, bright, full page</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="w-16 h-20 mx-auto mb-2 rounded bg-muted border-2 border-red-500/30 flex items-center justify-center rotate-12 opacity-50">
                  <FileText className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-xs text-red-400 font-medium">Bad ✗</p>
                <p className="text-xs text-muted-foreground">Dark, angled, blurry</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={resetUpload}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Try again with a new photo
              </button>
              <p className="text-center text-xs text-muted-foreground">
                Or <Link to={`/courses/${moduleId}/lessons/${lessonId}#quiz`} className="text-primary hover:underline">complete the quiz online instead</Link>
              </p>
            </div>
          </div>
        )}

        {/* State: Error */}
        {state === 'error' && (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <p className="text-sm text-red-400">{errorMsg || 'Something went wrong. Please try again.'}</p>
            </div>
            <button
              onClick={resetUpload}
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Practice retake link for passed submissions */}
        {pastSubmission?.passed && state === 'empty' && !showPastResults && (
          <button
            onClick={resetUpload}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors block mx-auto"
          >
            Submit another attempt for practice
          </button>
        )}
      </div>
    </div>
  );
}
