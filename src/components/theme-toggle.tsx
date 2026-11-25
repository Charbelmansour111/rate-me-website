'use client';

import { useEffect } from 'react';

import { THEME_COLORS, type Theme } from '@/config/theme';

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  // Next.js writes one tag per system preference; a choice on the page overrides both.
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute('content', THEME_COLORS[theme]);
  }
}

function saved(): string | null {
  try {
    return localStorage.getItem('theme');
  } catch {
    return null;
  }
}

/** The current theme lives on <html data-theme>; CSS shows the matching label and icon. */
export function ThemeToggle({ toLight, toDark }: { toLight: string; toDark: string }) {
  useEffect(() => {
    // Follow the system while the visitor has not chosen.
    const system = matchMedia('(prefers-color-scheme: dark)');
    const follow = () => {
      if (!saved()) apply(system.matches ? 'dark' : 'light');
    };
    // Now as well: the system may have changed while the page was loading.
    if (saved()) apply(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    else follow();
    system.addEventListener('change', follow);
    return () => system.removeEventListener('change', follow);
  }, []);

  function toggle() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    apply(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage is blocked: the choice lasts for this page.
    }
  }
  const icon = {
    viewBox: '0 0 24 24',
    width: 22,
    height: 22,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    'aria-hidden': true,
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className="grid size-11 place-items-center rounded-lg hover:bg-soft"
    >
      <span className="only-dark">
        <svg {...icon}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v1M12 20v1M3 12h1M20 12h1M5.6 5.6l.7.7M17.7 17.7l.7.7M18.4 5.6l-.7.7M6.3 17.7l-.7.7" />
        </svg>
        <span className="sr-only">{toLight}</span>
      </span>
      <span className="only-light">
        <svg {...icon}>
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.500 10.500Z" />
        </svg>
        <span className="sr-only">{toDark}</span>
      </span>
    </button>
  );
}
