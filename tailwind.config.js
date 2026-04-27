module.exports = {
  darkMode: 'class', // use 'class' strategy so we can toggle it on html element
  // Scope all generated utility classes to the embed container so they never
  // override styles on the host page (e.g. the host page's .grid or h2 rules).
  important: '.corsa-embed-container',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {},
  },
  // Disable Preflight (Tailwind's global CSS reset) so that loading the embed
  // script does not alter h2 font-sizes, margins, or any other element styles
  // that belong to the host page.
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};