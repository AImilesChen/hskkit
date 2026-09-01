/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/topics/visuals.ts",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B3A5C",
          hover: "#142D4A",
          light: "#E8F0F8",
        },
        accent: {
          DEFAULT: "#D4634E",
          hover: "#B85440",
        },
        success: "#4A9B6B",
        warning: "#D4A03E",
        bg: "#FDFBF7",
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F5F1EB",
        },
        ink: {
          DEFAULT: "#1A1A2E",
          secondary: "#4A4A5A",
          muted: "#8A8A9A",
        },
        border: "#E5E1DB",
        chinese: {
          red: "#C23A30",
          ink: "#2C2C2C",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
        chinese: ["var(--font-chinese)"],
      },
      fontSize: {
        h1: ["48px", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["36px", { lineHeight: "1.3", fontWeight: "600" }],
        h3: ["24px", { lineHeight: "1.4", fontWeight: "600" }],
        h4: ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "1.7", fontWeight: "400" }],
        body: ["16px", { lineHeight: "1.7", fontWeight: "400" }],
        small: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "500" }],
        "chinese-display": ["32px", { lineHeight: "1.6", fontWeight: "400" }],
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "24px",
        6: "32px",
        7: "48px",
        8: "64px",
        9: "96px",
        10: "128px",
      },
      maxWidth: {
        content: "1200px",
        readable: "800px",
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        icon: "10px",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
      },
    },
  },
  plugins: [],
};
