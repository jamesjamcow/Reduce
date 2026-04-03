/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}', './share-extension/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#10201B',
        canvas: '#F5E9D6',
        sand: '#E5CFAE',
        ember: '#C45A3C',
        leaf: '#6D7E57',
        dusk: '#314E44',
        mist: '#FAF4EA',
      },
      fontFamily: {
        mono: ['SpaceMono'],
      },
      boxShadow: {
        card: '0 12px 24px rgba(20, 24, 18, 0.12)',
      },
    },
  },
  plugins: [],
};
