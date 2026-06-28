import { Volume2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ScreenReaderIndicator({ visible }: { visible: boolean }) {
  const isMobile = useIsMobile();

  if (!visible) return null;

  return (
    <div
      data-no-read="true"
      className="fixed z-[10000] flex items-center gap-1.5 rounded-full bg-primary text-white text-xs font-medium px-3.5 py-1.5 shadow-lg"
      style={
        isMobile
          ? { bottom: '80px', left: '16px' }
          : { top: '16px', left: '16px' }
      }
      aria-label="Screen reader is currently on. To turn it off, go to Settings, then Accessibility."
    >
      <Volume2 className="w-3.5 h-3.5" />
      Read aloud: ON
    </div>
  );
}

