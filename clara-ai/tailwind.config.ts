import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./public/**/*.html",
    "./node_modules/flowbite-react/lib/**/*.js",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        apple: ["apple-system", "BlinkMacSystemFont", "sans-serif"],
        caveat: ["Caveat"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        "color-1": "hsl(var(--color-1))",
        "color-2": "hsl(var(--color-2))",
        "color-3": "hsl(var(--color-3))",
        "color-4": "hsl(var(--color-4))",
        "color-5": "hsl(var(--color-5))",
      },
      animation: {
        rainbow: "rainbow var(--speed, 2s) infinite linear",
      },
      keyframes: {
        rainbow: {
          "0%": {
            "background-position": "0%",
          },
          "100%": {
            "background-position": "200%",
          },
        },
      },
    },
  },
  daisyui: {
    themes: [
      {
        light: {
          primary: "#0091ff", // Bleu de notre logo
          "primary-content": "#FFFFFF", // Texte blanc sur fond bleu
          secondary: "#00b8ff", // Bleu ciel de notre logo
          "secondary-content": "#FFFFFF", // Texte blanc sur fond bleu ciel
          accent: "#ff00f5", // Rose de notre logo
          "accent-content": "#FFFFFF", // Texte blanc sur fond rose
          neutral: "#e5e5e7", // Gris clair macOS
          "neutral-content": "#1d1d1f", // Texte sombre sur fond gris
          "base-100": "#ffffff", // Blanc pur macOS
          "base-200": "#f5f5f7", // Gris très clair macOS
          "base-300": "#e5e5e7", // Gris clair macOS
          "base-content": "#1d1d1f", // Texte principal macOS
          info: "#86868b", // Gris moyen macOS
          success: "#28cd41", // Vert macOS
          warning: "#ff9f0a", // Orange macOS
          error: "#ff3b30", // Rouge macOS
          glass: "rgba(255, 255, 255, 0.8)",
          "rounded-box": "1rem",
          "rounded-btn": "1.5rem",
          "rounded-badge": "1rem",
          shadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
        },
        dark: {
          primary: "#0a84ff", // Bleu macOS dark
          "primary-content": "#FFFFFF", // Texte blanc sur fond bleu
          secondary: "#64d2ff", // Bleu ciel macOS dark
          "secondary-content": "#000000", // Texte noir sur fond bleu ciel
          accent: "#ff00b8", // Rose macOS dark
          "accent-content": "#FFFFFF", // Texte blanc sur fond rose
          neutral: "#2c2c2e", // Gris foncé macOS
          "neutral-content": "#ffffff", // Texte blanc sur fond gris
          "base-100": "#1c1c1e", // Noir profond macOS
          "base-200": "#2c2c2e", // Gris foncé macOS
          "base-300": "#3a3a3c", // Gris plus clair macOS
          "base-content": "#ffffff", // Texte principal macOS
          info: "#98989d", // Gris clair macOS
          success: "#30d158", // Vert macOS dark
          warning: "#ffd60a", // Jaune macOS dark
          error: "#ff453a", // Rouge macOS dark
          glass: "rgba(28, 28, 30, 0.8)",
          "rounded-box": "1rem",
          "rounded-btn": "1.5rem",
          "rounded-badge": "1rem",
          shadow:
            "0 4px 12px 0 rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
        },
      },
    ],
  },
  plugins: [require("daisyui"), require("tailwindcss-animate")],
};

export default config;
