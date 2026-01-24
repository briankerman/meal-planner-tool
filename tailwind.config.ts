import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'simpler-green': {
          50: '#f4f7f2',
          100: '#e8efe4',
          200: '#d1dfc9',
          300: '#b5c9a9',
          400: '#9caf88',
          500: '#7d9467',
          600: '#637a50',
          700: '#4f6241',
          800: '#414f37',
          900: '#38432f',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
