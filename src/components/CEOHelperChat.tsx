import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Minus, Send, Bot, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore, getLevelTitle } from '@/stores/userStore';
import { useSettings } from '@/contexts/SettingsContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function CEOHelperChat() {
  const { profile, user, addXP } = useUserStore();
  const { settings, ceoHistoryCleared } = useSettings();
  const location = useLocation();
  const isMobile = useIsMobile();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [chipsVisible, setChipsVisible] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLessonPage = location.pathname.includes('/lessons/');
  const dailyLimit = settings.ceoHelperDailyLimit;
  const limitReached = messagesUsed >= dailyLimit;

  // Clear history when triggered from settings
  useEffect(() => {
    if (ceoHistoryCleared > 0) {
      setMessages([]);
      setHasShownWelcome(false);
      setChipsVisible(true);
    }
  }, [ceoHistoryCleared]);

  // Fetch daily usage
  useEffect(() => {
    if (!user) return;
    const fetchUsage = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('ceo_helper_usage')
        .select('message_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      if (data) setMessagesUsed(data.message_count);
    };
    fetchUsage();
  }, [user]);

  // Welcome message
  useEffect(() => {
    if (isOpen && !hasShownWelcome && profile) {
      const welcomeMsg: ChatMessage = {
        role: 'assistant',
        content: `Hey ${profile.username}! 👋 I'm CEO Helper — your personal AI business coach on Future CEO Lab.\n\nI can help you with:\n• Understanding lesson content\n• Building your business idea\n• Explaining business concepts\n• Feedback on your ideas\n• Questions about marketing, finance, and pitching\n\nWhat are you working on today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
      setHasShownWelcome(true);
    }
  }, [isOpen, hasShownWelcome, profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  const incrementUsage = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('ceo_helper_usage')
      .select('message_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('ceo_helper_usage')
        .update({ message_count: existing.message_count + 1 })
        .eq('user_id', user.id)
        .eq('date', today);
    } else {
      await supabase
        .from('ceo_helper_usage')
        .insert({ user_id: user.id, date: today, message_count: 1 });
      await addXP(10, 'ceo_helper_daily_use');
    }
    setMessagesUsed((prev) => prev + 1);
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || limitReached || !user) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setChipsVisible(false);
    setIsLoading(true);

    await incrementUsage();

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ceo-helper-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: history,
            username: profile?.username,
            levelTitle: profile ? getLevelTitle(profile.xp) : 'Budget Rookie',
            currentModule: '',
            currentLesson: isLessonPage ? location.pathname : '',
          }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error('Stream failed');

      let assistantSoFar = '';
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2]?.role === 'user') {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                  );
                }
                return [...prev, { role: 'assistant', content: assistantSoFar, timestamp: new Date() }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error('CEO Helper error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I'm having trouble right now. Try again in a moment!", timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, limitReached, user, profile, isLessonPage, location.pathname]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const chips = isLessonPage
    ? ['Explain this lesson simply', "I'm stuck on a quiz question", 'How does this apply to my idea?']
    : ['Explain a concept to me', 'Help with my business idea', 'I have a question'];

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Guard: hide if setting is off or not logged in (after all hooks)
  if (!settings.showCEOHelper || !user || !profile) return null;

  return (
    <>
      {/* Chat Panel */}
      {isOpen && !isMinimized && (
        <div
          className={cn(
            'fixed z-[9999]',
            isMobile
              ? 'bottom-0 right-0 left-0 h-[85vh] rounded-t-[20px]'
              : 'bottom-[100px] right-6 w-[380px] h-[520px] rounded-2xl'
          )}
          style={{
            background: '#12121A',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            animation: 'ceoSlideUp 0.2s ease-out',
          }}
        >
          <div
            className="flex items-center justify-between px-4 h-14 rounded-t-2xl"
            style={{ background: '#0D1B2A', borderBottom: '1px solid hsl(var(--primary))' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--primary))' }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-tight">CEO Helper</p>
                <p className="text-[11px] leading-tight" style={{ color: 'hsl(var(--primary))' }}>Your AI business coach</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(true)} className="p-1.5 text-white hover:text-white/70 transition-colors">
                <Minus className="w-[18px] h-[18px]" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-white hover:text-white/70 transition-colors">
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ height: 'calc(100% - 56px - 80px)', background: '#12121A' }}
            aria-live="polite"
          >
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}>
                {msg.role === 'assistant' && (
                  <span className="text-[10px] mb-1 ml-1" style={{ color: 'hsl(var(--primary))' }}>CEO Helper</span>
                )}
                <div
                  className="max-w-[80%] px-3.5 py-2.5 text-[13px] text-white leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: msg.role === 'user' ? 'hsl(var(--primary))' : '#1E1E2E',
                    borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  }}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] mt-1 mx-1" style={{ color: '#6B7280' }}>{formatTime(msg.timestamp)}</span>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-start">
                <div className="flex gap-1.5 px-4 py-3" style={{ background: '#1E1E2E', borderRadius: '4px 16px 16px 16px' }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-2 h-2 rounded-full bg-white/50" style={{ animation: `ceoTypingDot 1.4s infinite ${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}

            {chipsVisible && messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    className="text-xs px-3.5 py-1.5 rounded-full border transition-colors"
                    style={{ borderColor: 'hsl(var(--primary))', color: 'hsl(var(--primary))', background: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(var(--primary))'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--primary))'; }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 py-3" style={{ background: '#0D1B2A', borderTop: '1px solid #1E1E2E' }}>
            {limitReached ? (
              <div className="text-center text-[12px] py-2" style={{ color: '#6B7280' }}>Daily limit reached — resets tomorrow</div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask CEO Helper anything..."
                    disabled={limitReached || isLoading}
                    className="flex-1 text-[13px] text-white placeholder:text-gray-500 outline-none px-4 py-2.5"
                    style={{ background: '#1E1E2E', border: '1px solid #374151', borderRadius: '24px' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--primary))')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isLoading || limitReached}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity"
                    style={{ background: input.trim() && !isLoading ? 'hsl(var(--primary))' : '#374151' }}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
                <p className="text-center text-[10px] mt-2" style={{ color: '#6B7280' }}>
                  {dailyLimit - messagesUsed} messages left today
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => {
          if (isMinimized) setIsMinimized(false);
          else setIsOpen(!isOpen);
        }}
        className="fixed z-[9999] flex flex-col items-center group"
        style={{ bottom: isMobile ? 16 : 24, right: isMobile ? 16 : 24 }}
        aria-label="Open CEO Helper chat"
      >
        <div
          className="relative w-[60px] h-[60px] rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
          style={{ background: '#0D1B2A', border: '2px solid hsl(var(--primary))', boxShadow: '0 0 18px hsl(var(--primary) / 0.4)' }}
        >
          {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500" style={{ animation: 'ceoPulse 2s infinite' }} />
        </div>
        <span className="text-white text-[10px] mt-1">CEO Helper</span>
      </button>

      <style>{`
        @keyframes ceoSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ceoPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
        @keyframes ceoTypingDot { 0%, 60%, 100% { opacity: 0.3; } 30% { opacity: 1; } }
      `}</style>
    </>
  );
}
