/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo Thambi 2"', 'Catamaran', '"Noto Sans Tamil"', 'sans-serif'],
      },
      colors: {
        cream: '#F7EDE2',
        coral: '#F5CAC3',
        salmon: '#F28482',
        sage: '#84A59D',
        plum: '#563E79',
        sun: '#FFCE80',
        sky: '#A9D6E5',
        mint: '#B7E4C7',
        lav: '#CDB4DB',
        clay: '#F4A259',
        bark: '#8D6E63',
      },
      borderWidth: {
        // the app's sticker outline. Tailwind's own scale skips 3, so without
        // this entry `border-3` is silently not a class at all.
        3: '3px',
      },
    },
  },
};
