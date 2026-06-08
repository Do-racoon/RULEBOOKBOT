import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#18202f",
        paper: "#fbfaf7",
        moss: "#4d7058",
        coral: "#db725b",
        saffron: "#e1a93b"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(24, 32, 47, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
