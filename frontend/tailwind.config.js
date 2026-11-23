/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#123c69",
          hover: "#0c2847",
          light: "#edf6fc",
        },
        secondary: {
          DEFAULT: "#087f8c",
          hover: "#06626d",
          light: "#e2f6f1",
        },
        accent: {
          DEFAULT: "#16a6a1",
          hover: "#128581",
          light: "#dff4f2",
        },
        dark: "#10243a",
        textMain: "#34445a",
        muted: "#718096",
        brandBg: "#f4f8fc",
        brandBorder: "#e3ebf3",
        brandGreen: "#16865c",
        rolePatient: "#326bc4",
        roleHospital: "#07856f",
        roleInsurer: "#8054bd",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 12px 35px rgba(18, 60, 105, 0.08)",
        hero: "0 25px 70px rgba(18, 60, 105, 0.15)",
      },
    },
  },
  plugins: [],
};
