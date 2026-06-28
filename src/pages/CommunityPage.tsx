import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRequireAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import { LevelBadge } from '@/components/LevelBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { Hash, Send, Pin, Pencil, Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const CHANNELS = [
  { id: 'general', label: 'general' },
  { id: 'module-1-mindset', label: 'module-1-mindset' },
  { id: 'module-2-business-concepts', label: 'module-2-business-concepts' },
  { id: 'module-3-marketing-branding', label: 'module-3-marketing-branding' },
  { id: 'module-4-social-media', label: 'module-4-social-media' },
  { id: 'module-5-finance', label: 'module-5-finance' },
  { id: 'module-6-launch-pitch', label: 'module-6-launch-pitch' },
];

const EMOJIS = ['👍', '❤️', '🔥', '💡'];

export default function CommunityPage() {
  useRequireAuth();
  const { user, addXP } = useUserStore();
  const [channel, setChannel] = useState('general');
  const [messages, setMessages] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [reactions, setReactions] = useState<Record<string, any[]>>({});
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [showChannels, setShowChannels] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('community_messages')
        .select('*')
        .eq('channel', channel)
        .order('created_at', { ascending: true })
        .limit(100);
      setMessages(data || []);

      const userIds = [...new Set((data || []).map((m: any) => m.user_id))];
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        const map: Record<string, any> = {};
        (profs || []).forEach((p: any) => { map[p.id] = p; });
        setProfiles(prev => ({ ...prev, ...map }));
      }

      const msgIds = (data || []).map((m: any) => m.id);
      if (msgIds.length > 0) {
        const { data: rxns } = await supabase
          .from('message_reactions')
          .select('*')
          .in('message_id', msgIds);
        const rxnMap: Record<string, any[]> = {};
        (rxns || []).forEach((r: any) => {
          if (!rxnMap[r.message_id]) rxnMap[r.message_id] = [];
          rxnMap[r.message_id].push(r);
        });
        setReactions(rxnMap);
      }
    };

    fetchMessages();

    const msgSub = supabase
      .channel(`community-msg-${channel}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_messages',
        filter: `channel=eq.${channel}`,
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const msg = payload.new as any;
          setMessages(prev => [...prev, msg]);
          if (!profiles[msg.user_id]) {
            const { data } = await supabase.from('profiles').select('*').eq('id', msg.user_id).maybeSingle();
            if (data) setProfiles(prev => ({ ...prev, [msg.user_id]: data }));
          }
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(m => m.id === (payload.new as any).id ? payload.new as any : m));
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    const rxnSub = supabase
      .channel(`community-rxn-${channel}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const r = payload.new as any;
          setReactions(prev => ({
            ...prev,
            [r.message_id]: [...(prev[r.message_id] || []), r],
          }));
        } else if (payload.eventType === 'DELETE') {
          const r = payload.old as any;
          setReactions(prev => ({
            ...prev,
            [r.message_id]: (prev[r.message_id] || []).filter(x => x.id !== r.id),
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgSub);
      supabase.removeChannel(rxnSub);
    };
  }, [user, channel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !user || sending) return;
    setSending(true);

    await supabase.from('community_messages').insert({
      channel,
      user_id: user.id,
      content: newMsg.trim(),
    });

    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('user_xp_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('reason', 'Community message')
      .gte('created_at', today);

    if ((count || 0) < 3) {
      await addXP(5, 'Community message');
    }

    setNewMsg('');
    setSending(false);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const existing = (reactions[messageId] || []).find(
      r => r.user_id === user.id && r.emoji === emoji
    );
    if (existing) {
      await supabase.from('message_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('message_reactions').insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      });
    }
  };

  const handleEdit = async (messageId: string) => {
    if (!editContent.trim()) return;
    await supabase.from('community_messages').update({ content: editContent.trim() }).eq('id', messageId);
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = async (messageId: string) => {
    await supabase.from('community_messages').delete().eq('id', messageId);
  };

  const pinnedMessages = messages.filter(m => m.is_pinned);

  const getGroupedReactions = (messageId: string) => {
    const rxns = reactions[messageId] || [];
    const grouped: Record<string, { count: number; hasMe: boolean }> = {};
    rxns.forEach(r => {
      if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, hasMe: false };
      grouped[r.emoji].count++;
      if (r.user_id === user?.id) grouped[r.emoji].hasMe = true;
    });
    return grouped;
  };

  return (
    <div className="flex h-full">
      <div className="hidden md:flex flex-col w-56 border-r border-border bg-card/30 p-3">
        <h2 className="font-heading font-bold text-foreground text-sm mb-3 px-2">Channels</h2>
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setChannel(ch.id)}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left',
              channel === ch.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            )}
          >
            <Hash className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{ch.label}</span>
          </button>
        ))}
      </div>

      <div className="md:hidden absolute top-0 left-0 right-0 z-10">
        <button
          onClick={() => setShowChannels(!showChannels)}
          className="w-full p-3 bg-card border-b border-border flex items-center gap-2 text-sm"
        >
          <Hash className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">{channel}</span>
        </button>
        {showChannels && (
          <div className="bg-card border-b border-border p-2 space-y-1">
            {CHANNELS.map((ch) => (
              <button
                key={ch.id}
                onClick={() => { setChannel(ch.id); setShowChannels(false); }}
                className={cn(
                  'w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                  channel === ch.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                )}
              >
                <Hash className="w-3.5 h-3.5" />
                {ch.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col pt-12 md:pt-0">
        <div className="hidden md:flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <span className="font-heading font-bold text-foreground">{channel}</span>
          </div>
        </div>

        {pinnedMessages.length > 0 && (
          <div className="px-4 py-2 bg-primary/5 border-b border-border">
            {pinnedMessages.map((m) => (
              <div key={m.id} className="flex items-start gap-2 text-xs">
                <Pin className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">{m.content}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          )}
          {messages.map((msg) => {
            const prof = profiles[msg.user_id];
            const isOwn = msg.user_id === user?.id;
            const grouped = getGroupedReactions(msg.id);

            return (
              <div key={msg.id} className="group flex gap-3 hover:bg-muted/10 rounded-lg p-2 -mx-2 transition-colors">
                <UserAvatar
                  xp={prof?.xp || 0}
                  avatarUrl={prof?.avatar_url}
                  username={prof?.username || '?'}
                  size={32}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{prof?.username || 'Unknown'}</span>
                    {prof && <LevelBadge xp={prof.xp} size="sm" />}
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isOwn && editingId !== msg.id && (
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 ml-auto transition-opacity">
                        <button
                          onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingId === msg.id ? (
                    <div className="flex gap-2 mt-1">
                      <input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEdit(msg.id)}
                        className="flex-1 bg-muted border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        autoFocus
                      />
                      <button onClick={() => handleEdit(msg.id)} className="p-1 text-emerald-400 hover:text-emerald-300">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground mt-0.5">{msg.content}</p>
                  )}

                  <div className="flex gap-1 mt-1 flex-wrap items-center">
                    {Object.entries(grouped).map(([emoji, { count, hasMe }]) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg.id, emoji)}
                        className={cn(
                          'text-xs rounded-full px-2 py-0.5 border transition-colors',
                          hasMe ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/30'
                        )}
                      >
                        {emoji} {count}
                      </button>
                    ))}
                    <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                      {EMOJIS.filter(e => !grouped[e]).map((e) => (
                        <button
                          key={e}
                          onClick={() => handleReaction(msg.id, e)}
                          className="text-xs hover:bg-muted rounded px-1 py-0.5 transition-colors"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={`Message #${channel}`}
              className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleSend}
              disabled={!newMsg.trim() || sending}
              className="bg-primary text-primary-foreground p-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
