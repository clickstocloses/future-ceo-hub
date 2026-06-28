import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type LinkStatus = 'checking' | 'ready' | 'invalid';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<LinkStatus>('checking');
  const [statusMessage, setStatusMessage] = useState('Verifying your reset link...');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const ready = status === 'ready';

  useEffect(() => {
    let mounted = true;

    const markReady = () => {
      if (!mounted) return;
      setStatus('ready');
      setStatusMessage('Choose a new password for your account');
    };

    const markInvalid = (message = 'This reset link is invalid or expired. Please request a new one.') => {
      if (!mounted) return;
      setStatus('invalid');
      setStatusMessage(message);
    };

    const cleanResetUrl = () => {
      window.history.replaceState({}, document.title, `${window.location.origin}/reset-password`);
    };

    const finishRecoveryFromUrl = async () => {
      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const urlError = query.get('error_description') || hash.get('error_description') || query.get('error') || hash.get('error');

      if (urlError) {
        markInvalid(decodeURIComponent(urlError.replace(/\+/g, ' ')));
        cleanResetUrl();
        return;
      }

      const code = query.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          markInvalid(error.message);
          cleanResetUrl();
          return;
        }
        cleanResetUrl();
        markReady();
        return;
      }

      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          markInvalid(error.message);
          cleanResetUrl();
          return;
        }
        cleanResetUrl();
        markReady();
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        markReady();
      } else {
        markInvalid();
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        markReady();
      }
    });

    finishRecoveryFromUrl();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return toast.error('Password must be at least 6 characters');
    }
    if (password !== confirm) {
      setFormError('Passwords do not match');
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      const userCheck = await Promise.race([
        supabase.auth.getUser(),
        new Promise<{ data: { user: null }; error: Error }>((resolve) =>
          setTimeout(() => resolve({ data: { user: null }, error: new Error('Session check timed out') }), 8000)
        ),
      ]) as Awaited<ReturnType<typeof supabase.auth.getUser>>;
      if (userCheck.error || !userCheck.data?.user) {
        setStatus('invalid');
        throw new Error('Your reset link has expired. Please request a new one from the login page.');
      }

      const result = await Promise.race([
        supabase.auth.updateUser({ password }),
        new Promise<{ error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out — please request a new reset link.')), 10000)
        ),
      ]) as Awaited<ReturnType<typeof supabase.auth.updateUser>>;
      if (result.error) throw result.error;
      setLoading(false);
      setSuccess(true);
      toast.success('Password updated! Your new password has been saved.');
    } catch (err: any) {
      setFormError(err.message || 'Failed to update password');
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-sm">FC</span>
            </div>
            <span className="font-heading font-bold text-foreground">Future CEO Lab</span>
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {success ? 'Password updated' : 'Set a new password'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {success
              ? 'Your new password has been saved to your account. You can now use it to sign in.'
              : statusMessage}
          </p>
        </div>

        {success ? (
          <div className="card-surface p-6 space-y-3">
            <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
              Password successfully updated and saved to your account.
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-heading font-semibold hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">Back to Log In</Link>
            </p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="card-surface p-6 space-y-4">
          {status === 'invalid' && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Request a fresh reset email from the login page, then open the newest email link.
            </div>
          )}
          {formError && status !== 'invalid' && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!ready}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={!ready}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !ready}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-heading font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">
              {status === 'invalid' ? 'Request a new reset link' : 'Back to Log In'}
            </Link>
          </p>
        </form>
        )}
      </div>
    </div>
  );
}
