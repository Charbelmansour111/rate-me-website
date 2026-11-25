/** Browser-bar colors: --page of each theme in src/app/palette.css (a unit test compares them). */
export const THEME_COLORS = { light: '#ffffff', dark: '#0b0b0c' } as const;
export type Theme = keyof typeof THEME_COLORS;

/**
 * Runs before paint: a saved choice wins, then the system preference, then light. Kept as a
 * string because it goes inline in the head.
 */
export const THEME_SCRIPT = `(function(){var t;try{t=localStorage.getItem('theme')}catch(e){}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.dataset.js=''})()`;
