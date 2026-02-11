/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        // sm: '640px' (default)
        // md: '768px' (default)  
        // lg: '1024px' (default)
        // xl: '1280px' (default)
        '2xl': '1536px',
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: "#4F46E5",
        border: "#E5E7EB",
      },
      keyframes: {
        'in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'in': 'in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

module.exports = config;
