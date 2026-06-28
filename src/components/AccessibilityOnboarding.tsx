import { useState } from 'react';
import { Eye, Ear, Check } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export default function AccessibilityOnboarding() {
  const { preferences, loading, updatePreferences } = useAccessibility();
  const [visuallyImpaired, setVisuallyImpaired] = useState(false);
  const [hearingImpaired, setHearingImpaired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading || preferences.hasSetPreferences) return null;

  const handleSave = async (apply: boolean) => {
    setSubmitting(true);
    await updatePreferences({
      visuallyImpaired: apply ? visuallyImpaired : false,
      auditoryImpaired: apply ? hearingImpaired : false,
      hasSetPreferences: true,
    });
    setSubmitting(false);
  };

  const CheckRow = ({
    icon: Icon,
    label,
    desc,
    checked,
    onChange,
  }: {
    icon: any;
    label: string;
    desc: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-colors text-left ${
        checked ? 'border-primary bg-primary/10' : 'border-[#374151] hover:border-primary/60'
      }`}
      aria-pressed={checked}
    >
      <div
        className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
          checked ? 'bg-primary border-primary' : 'border-[#4b5563]'
        }`}
      >
        {checked && <Check className="w-4 h-4 text-white" />}
      </div>
      <Icon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
      <div>
        <div className="text-[15px] font-semibold text-white">{label}</div>
        <div className="text-[13px] text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="w-full max-w-[520px] mx-4 rounded-[20px] border-2 border-primary p-8"
        style={{ background: '#12121A' }}
        role="dialog"
        aria-modal="true"
        aria-label="Accessibility setup"
      >
        <h2 className="text-center text-[22px] font-bold text-white mb-2">
          Welcome to Future CEO Lab
        </h2>
        <p className="text-center text-[14px] text-muted-foreground leading-[1.6] mb-6">
          Tell us how we can make the site work best for you. You can change these any time in Settings &gt; Accessibility.
        </p>

        <div className="space-y-3 mb-6">
          <CheckRow
            icon={Eye}
            label="I am visually impaired"
            desc="Enables hover-to-read so content is spoken aloud as you navigate."
            checked={visuallyImpaired}
            onChange={setVisuallyImpaired}
          />
          <CheckRow
            icon={Ear}
            label="I am hearing impaired"
            desc="Automatically turns on captions for all videos."
            checked={hearingImpaired}
            onChange={setHearingImpaired}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={submitting}
            className="flex-1 rounded-xl px-6 py-3 bg-transparent border-2 border-[#374151] text-white font-semibold text-[15px] transition-colors hover:border-primary disabled:opacity-50"
          >
            Skip / Neither
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={submitting || (!visuallyImpaired && !hearingImpaired)}
            className="flex-1 rounded-xl px-6 py-3 bg-primary text-white font-bold text-[15px] transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}
