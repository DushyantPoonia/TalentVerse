/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { colors: { forest: '#163B32', emerald: '#168568', mint: '#DDF5E9', lime: '#D8F08B', ivory: '#FAFAF6' }, fontFamily: { sans: ['DM Sans', 'sans-serif'], display: ['Manrope', 'sans-serif'] } } },
  plugins: []
};
