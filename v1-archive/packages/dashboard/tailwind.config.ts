import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Tachi brand colors - sync these with Plasmic
      colors: {
        primary: {
          50: '#f0fdf4',
          500: '#22c55e', 
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d'
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          900: '#0f172a'
        },
        accent: {
          500: '#f59e0b',
          600: '#d97706'
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      // Quick iteration utilities
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
};
export default config;
