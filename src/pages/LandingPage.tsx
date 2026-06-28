import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Users, TrendingUp, Crown, Trophy, Star } from 'lucide-react';
import logoImg from '@/assets/logo.png';

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getLevelTitle } from '@/stores/userStore';
import { LevelBadge } from '@/components/LevelBadge';
import { Skeleton } from '@/components/ui/skeleton';

const ceoEase = [0.2, 0, 0, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: ceoEase as unknown as [number, number, number, number] },
};

const features = [
  {
    icon: Zap,
    title: 'Gamified Learning',
    desc: 'Earn XP, unlock levels, and compete on leaderboards as you master business fundamentals.',
  },
  {
    icon: Users,
    title: 'Live Community',
    desc: 'Connect with peers in real-time channels, share ideas, and grow together.',
  },
  {
    icon: TrendingUp,
    title: 'Track Your Progress',
    desc: 'Visual dashboards, streaks, and badges keep you motivated and accountable.',
  },
];

const rankIcons = [Crown, Trophy, Star];

const PHOTO_1 = 'https://images.pexels.com/photos/5716018/pexels-photo-5716018.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
const PHOTO_2 = 'https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
const PHOTO_3 = 'https://images.pexels.com/photos/3194519/pexels-photo-3194519.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
const PHOTO_4 = 'https://images.pexels.com/photos/776615/pexels-photo-776615.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
const PHOTO_5 = 'https://images.pexels.com/photos/2789303/pexels-photo-2789303.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

const stats = [
  { number: '6', label: 'Modules', desc: 'From mindset to launch' },
  { number: '30', label: 'Lessons', desc: 'Video + quiz + hands-on work' },
  { number: '100%', label: 'Free', desc: 'No cost to join and learn' },
];

export default function LandingPage() {
  const [topStudents, setTopStudents] = useState<{ username: string; xp: number }[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('username, xp')
      .order('xp', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setTopStudents(data?.filter(p => p.xp > 0) ?? []);
        setLeaderboardLoading(false);
      });
  }, []);
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Future CEO Lab" className="w-8 h-8 rounded-lg" />
            <span className="font-heading font-bold text-foreground">Future CEO Lab</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — split layout */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-12">
          {/* Left */}
          <div className="flex-1 text-center md:text-left">
            <motion.div {...fadeUp}>
              <span className="inline-block text-xs font-heading font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                Built for Future Leaders
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6 leading-tight"
            >
              Master the Market.{' '}
              <span className="gradient-text">Own the Future.</span>
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-2xl mb-4"
            >
              A Better Way To Learn.
            </motion.p>

            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.25 }}
              className="text-sm text-muted-foreground/70 font-heading mb-10"
            >
              Learn it. Build it. Lead it.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
            >
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-heading font-semibold hover:bg-primary/90 transition-all glow-primary hover:glow-strong"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-6 py-3 rounded-xl font-heading font-semibold hover:bg-muted/50 transition-all"
              >
                See How It Works
              </a>
            </motion.div>
          </div>

          {/* Right — hero photo (hidden on mobile) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0, 0, 1], delay: 0.2 }}
            className="hidden md:block flex-1 relative"
          >
            <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <div className="absolute inset-0 bg-[#12121A]" />
              <img
                src={PHOTO_1}
                alt="Business team collaborating on a project"
                loading="lazy"
                className="w-full h-full object-cover object-center relative z-10"
              />
              <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                  background: 'linear-gradient(to right, hsl(var(--background)) 0%, transparent 30%)',
                }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Photo Banner */}
      <section className="relative w-full h-[280px] sm:h-[280px] max-sm:h-[180px] overflow-hidden">
        <div className="absolute inset-0 bg-[#12121A]" />
        <img
          src={PHOTO_3}
          alt="Team planning session with laptops"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0" style={{ background: 'rgba(10, 10, 15, 0.55)' }} />
        <div className="relative z-10 flex items-center justify-center h-full px-4">
          <p className="text-white text-center text-xl font-medium max-w-xl">
            Join thousands of future founders building real business skills
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.2, 0, 0, 1] }}
                className="card-surface-hover p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Row with Photo Background */}
      <section className="relative w-full h-[200px] sm:h-[200px] max-sm:h-auto max-sm:py-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#12121A]" />
        <img
          src={PHOTO_2}
          alt="Diverse professionals working together"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0" style={{ background: 'rgba(10, 10, 15, 0.80)' }} />
        <div className="relative z-10 flex items-center justify-center h-full px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-16">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[32px] font-bold text-white leading-tight">{s.number}</p>
                <p className="text-sm font-medium text-primary mt-1">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two-Card Inspiration Strip */}
      <section className="py-12 px-4 sm:px-6 bg-background">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              src: PHOTO_4,
              alt: 'Business professionals in formal attire',
              heading: 'Dress for the role you want',
              sub: 'Future CEO Lab prepares you to think, talk, and build like a founder',
            },
            {
              src: PHOTO_5,
              alt: 'Young entrepreneurs working on laptops',
              heading: 'Learn by doing, not just watching',
              sub: 'Every lesson includes a real project you can add to your portfolio',
            },
          ].map((card) => (
            <motion.div
              key={card.heading}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl overflow-hidden h-[320px] max-sm:h-[240px]"
            >
              <div className="absolute inset-0 bg-[#12121A]" />
              <img
                src={card.src}
                alt={card.alt}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0" style={{ background: 'rgba(10, 10, 15, 0.5)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <h3 className="text-white font-heading font-bold text-lg mb-1">{card.heading}</h3>
                <p className="text-muted-foreground text-sm">{card.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-heading font-bold text-foreground text-center mb-8">
              Top Performers
            </h2>
            <div className="card-surface p-4 space-y-3">
              {leaderboardLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                    <Skeleton className="w-6 h-5" />
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="flex-1 h-4" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                ))
              ) : topStudents.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">
                  Be the first on the leaderboard!
                </p>
              ) : (
                topStudents.map((s, i) => {
                  const Icon = rankIcons[i] ?? Star;
                  const rankColor = i === 0 ? 'text-level-tycoon' : i === 1 ? 'text-muted-foreground' : 'text-level-brand';
                  return (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                      <span className="text-data text-muted-foreground w-6 text-center">#{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Icon className={`w-4 h-4 ${rankColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground block truncate">{s.username}</span>
                        <LevelBadge xp={s.xp} size="sm" />
                      </div>
                      <span className="text-data text-sm text-primary">{s.xp.toLocaleString()} XP</span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Future CEO Lab" className="w-7 h-7 rounded-lg" />
            <span className="font-heading font-bold text-foreground text-sm">Future CEO Lab</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors">Log In</Link>
            <Link to="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            <Link to="/sources" className="hover:text-foreground transition-colors">Sources</Link>
          </div>
          <p className="text-xs text-muted-foreground/60">Built for FBLA Website Design 2025–2026</p>
        </div>
      </footer>
    </div>
  );
}