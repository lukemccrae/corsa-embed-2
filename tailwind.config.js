module.exports = {
  darkMode: 'class', // use 'class' strategy so we can toggle it on html element
  content: [
    './src/app/**/*.{ts,tsx,js,jsx}',
    './src/components/**/*.{ts,tsx,js,jsx}',
    // add more paths as needed
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};