import type { Config } from "tailwindcss";

// Los grises y el acento apuntan a variables CSS definidas por tema en
// globals.css. Así, cambiar el atributo data-tema repinta toda la aplicación
// sin modificar las clases de los componentes.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Superficie de tarjetas y color de marca para botones
        superficie: "var(--c-surface)",
        primario: {
          DEFAULT: "var(--c-primary)",
          hover: "var(--c-primary-hover)",
        },
        gray: {
          50: "var(--g-50)",
          100: "var(--g-100)",
          200: "var(--g-200)",
          300: "var(--g-300)",
          400: "var(--g-400)",
          500: "var(--g-500)",
          600: "var(--g-600)",
          700: "var(--g-700)",
          800: "var(--g-800)",
          900: "var(--g-900)",
        },
        blue: {
          50: "var(--a-50)",
          100: "var(--a-100)",
          200: "var(--a-200)",
          300: "var(--a-300)",
          400: "var(--a-400)",
          500: "var(--a-500)",
          600: "var(--a-600)",
          700: "var(--a-700)",
          800: "var(--a-800)",
          900: "var(--a-900)",
          950: "var(--a-950)",
        },
        indigo: {
          400: "var(--i-400)",
          500: "var(--i-500)",
          600: "var(--i-600)",
          700: "var(--i-700)",
          800: "var(--i-800)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
