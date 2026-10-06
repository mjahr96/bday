import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070605", coal: "#12100d", velvet: "#8e1b24", gold: { DEFAULT: "#d4af37", light: "#f3e0a1", dark: "#8a6c1d" },
      },
      fontFamily: { display: ["var(--font-display)", "serif"], sans: ["var(--font-body)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
