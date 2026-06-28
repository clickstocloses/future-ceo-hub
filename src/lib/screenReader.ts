// ScreenReader singleton — hover-to-read system using Web Speech API

let enabled = false;
let lastSpokenText = '';
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let speechRate = 1.0;

function getReadableText(el: HTMLElement): string {
  // Skip elements that shouldn't be read
  if (el.getAttribute('data-no-read') === 'true') return '';
  if (el.getAttribute('aria-hidden') === 'true') return '';
  const tag = el.tagName.toLowerCase();
  if (tag === 'script' || tag === 'style') return '';
  if (el.offsetWidth === 0 && el.offsetHeight === 0) return '';

  // Priority: aria-label > aria-labelledby > alt > placeholder > title > textContent
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return prefixByRole(el, ariaLabel);

  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const refEl = document.getElementById(labelledBy);
    if (refEl?.textContent?.trim()) return prefixByRole(el, refEl.textContent.trim());
  }

  if (tag === 'img') {
    const alt = (el as HTMLImageElement).alt;
    return alt ? `Image: ${alt}` : 'Image, no description';
  }

  if (tag === 'input' || tag === 'textarea') {
    const input = el as HTMLInputElement;
    const label = getInputLabel(el) || input.placeholder || input.name || 'unlabeled';
    if (input.type === 'checkbox') {
      return `Checkbox: ${label}. ${input.checked ? 'Checked' : 'Unchecked'}`;
    }
    if (input.type === 'radio') {
      return `Radio button: ${label}. ${input.checked ? 'Selected' : 'Not selected'}`;
    }
    const val = input.value ? `. Current value: ${input.value}` : '';
    return `Text field: ${label}${val}`;
  }

  if (tag === 'select') {
    const select = el as HTMLSelectElement;
    const label = getInputLabel(el) || 'unlabeled';
    return `Dropdown: ${label}. Selected: ${select.options[select.selectedIndex]?.text || 'none'}`;
  }

  const text = el.innerText?.trim() || el.textContent?.trim() || '';
  if (!text) return '';

  return prefixByRole(el, text);
}

function prefixByRole(el: HTMLElement, text: string): string {
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute('role');

  // Check for toggle/switch
  if (role === 'switch') {
    const checked = el.getAttribute('aria-checked') === 'true';
    return `Toggle: ${text}. Currently ${checked ? 'on' : 'off'}`;
  }

  if (tag === 'button' || role === 'button') return `Button: ${text}`;
  if (tag === 'a' || role === 'link') return `Link: ${text}`;
  if (/^h[1-6]$/.test(tag)) return `Heading: ${text}`;
  if (tag === 'nav' || role === 'navigation') return `Navigation: ${text}`;
  if (role === 'progressbar') {
    const val = el.getAttribute('aria-valuenow');
    return val ? `Progress: ${val}% complete` : `Progress bar: ${text}`;
  }

  return text;
}

function getInputLabel(el: HTMLElement): string {
  const id = el.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }
  const parentLabel = el.closest('label');
  if (parentLabel) {
    // Get label text excluding the input itself
    const clone = parentLabel.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('input, textarea, select').forEach(c => c.remove());
    return clone.textContent?.trim() || '';
  }
  return '';
}

export function speak(text: string, rate?: number) {
  if (!('speechSynthesis' in window)) return;
  if (!text || text.trim().length === 0) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate ?? speechRate;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  utterance.lang = 'en-US';
  speechSynthesis.speak(utterance);
}

function handleHover(e: MouseEvent) {
  if (!enabled) return;
  const target = (e.target as HTMLElement)?.closest?.('[aria-label], button, a, h1, h2, h3, h4, h5, h6, input, textarea, select, [role="button"], [role="switch"], [role="link"], [role="progressbar"], p, span, li, td, th, label, img') as HTMLElement | null;
  if (!target) return;
  if (target.closest('[data-no-read="true"]')) return;

  const text = getReadableText(target);
  if (!text || text === lastSpokenText) return;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    lastSpokenText = text;
    speak(text);
  }, 300);
}

function handleFocus(e: FocusEvent) {
  if (!enabled) return;
  const target = e.target as HTMLElement;
  if (!target || target.closest('[data-no-read="true"]')) return;

  const text = getReadableText(target);
  if (!text || text === lastSpokenText) return;
  lastSpokenText = text;
  speak(text);
}

function handleKeydown(e: KeyboardEvent) {
  if (!enabled) return;
  if (e.key === 'Escape') {
    speechSynthesis.cancel();
    lastSpokenText = '';
  }
}

export const ScreenReader = {
  enable() {
    if (enabled) return;
    enabled = true;
    document.addEventListener('mouseover', handleHover, true);
    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('keydown', handleKeydown, true);
  },

  disable() {
    enabled = false;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    document.removeEventListener('mouseover', handleHover, true);
    document.removeEventListener('focusin', handleFocus, true);
    document.removeEventListener('keydown', handleKeydown, true);
    lastSpokenText = '';
    if (debounceTimer) clearTimeout(debounceTimer);
  },

  isEnabled() {
    return enabled;
  },

  setRate(rate: number) {
    speechRate = rate;
  },

  isSupported() {
    return 'speechSynthesis' in window;
  },
};
