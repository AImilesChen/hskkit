/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#132238",
        muted: "#5b677a",
        brand: "#246bfe",
        soft: "#eef4ff",
        line: "#d9e3f5",
      },
    },
  },
  plugins: [],
};
