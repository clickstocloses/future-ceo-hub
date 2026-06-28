import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function SourcesPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
      <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">Credits & Sources</h1>
      <p className="text-muted-foreground mb-8">Third-party resources, libraries, and attributions used in Future CEO Lab.</p>

      <div className="space-y-6">
        <Section title="Technology Stack">
          <SourceItem name="React" desc="UI library for building user interfaces" url="https://react.dev" />
          <SourceItem name="TypeScript" desc="Typed superset of JavaScript" url="https://typescriptlang.org" />
          <SourceItem name="Vite" desc="Next generation frontend build tool" url="https://vitejs.dev" />
          <SourceItem name="Tailwind CSS" desc="Utility-first CSS framework" url="https://tailwindcss.com" />
          <SourceItem name="Supabase" desc="Open source backend-as-a-service (auth, database, realtime)" url="https://supabase.com" />
        </Section>

        <Section title="UI Libraries">
          <SourceItem name="shadcn/ui" desc="Re-usable component library built on Radix UI" url="https://ui.shadcn.com" />
          <SourceItem name="Lucide React" desc="Beautiful & consistent icon set" url="https://lucide.dev" />
          <SourceItem name="Framer Motion" desc="Production-ready animation library" url="https://www.framer.com/motion" />
          <SourceItem name="React Confetti" desc="Confetti animation component" url="https://www.npmjs.com/package/react-confetti" />
        </Section>

        <Section title="State Management">
          <SourceItem name="Zustand" desc="Small, fast state management" url="https://zustand-demo.pmnd.rs" />
          <SourceItem name="TanStack Query" desc="Powerful data fetching & caching" url="https://tanstack.com/query" />
        </Section>

        <Section title="Typography">
          <SourceItem name="Space Grotesk" desc="Heading typeface by Florian Karsten" url="https://fonts.google.com/specimen/Space+Grotesk" />
          <SourceItem name="Inter" desc="Body typeface by Rasmus Andersson" url="https://rsms.me/inter" />
        </Section>

        <Section title="Educational Content">
          <p className="text-sm text-muted-foreground">
            Lesson content, quiz questions, and curriculum structure were developed for the FBLA Website Design competition 2025–2026.
            All educational material is original or properly licensed.
          </p>
        </Section>

        <div className="card-surface p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Built for <span className="text-foreground font-medium">FBLA Website Design 2025–2026</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Future CEO Lab — Learn it. Build it. Lead it.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-surface p-5">
      <h2 className="font-heading font-bold text-foreground mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SourceItem({ name, desc, url }: { name: string; desc: string; url: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <div>
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary hover:underline flex-shrink-0"
      >
        Visit →
      </a>
    </div>
  );
}
