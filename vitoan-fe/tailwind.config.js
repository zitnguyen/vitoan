/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00b14f",
          dark: "#049245",
          light: "#7fe3a8",
        },
        secondary: {
          DEFAULT: "#0091ff",
          dark: "#0072cc",
        },
        math: "#0091ff",
        vietnamese: "#ff8a00",
        navy: "#0b2340",
        ink: "#2b1a4a",
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "sans-serif"],
        display: ["Nunito", "system-ui", "sans-serif"],
      },
      // Elevation scale modeled on Material Design's dp-based shadow levels:
      // each step layers a tight "key light" shadow with a softer "ambient" shadow.
      boxShadow: {
        // Thẻ phẳng viền + "chân" đổ xuống (giống ViChess) để mọi trang cùng phong cách anime
        // Thẻ phẳng viền + "chân" đổ xuống. Giá trị lấy từ biến CSS (index.css): trang học sinh
        // viền mực đậm kiểu anime, trang quản trị (.admin-ui) viền nhạt cho dễ đọc bảng biểu.
        "elevation-1": "var(--elev-1)",
        "elevation-2": "var(--elev-2)",
        "elevation-3": "0 4px 8px rgb(15 23 42 / 0.06), 0 16px 32px -8px rgb(15 23 42 / 0.14)",
        "elevation-4": "0 8px 16px rgb(15 23 42 / 0.08), 0 24px 48px -12px rgb(15 23 42 / 0.18)",
        // Khối nổi kiểu "phím bấm" (giống ViChess)
        pop: "0 4px 0 0 #2b1a4a",
        "pop-lg": "0 6px 0 0 #2b1a4a",
      },
      // Thang chữ cho học sinh tiểu học: chữ nhỏ nhất 14px, chữ thường 16–17px để các bé
      // đọc dễ. Ghi đè cả xs/sm/base/lg mặc định của Tailwind để toàn bộ UI to lên đồng bộ.
      fontSize: {
        xs: ["0.875rem", { lineHeight: "1.35rem" }],
        sm: ["1rem", { lineHeight: "1.5rem" }],
        base: ["1.0625rem", { lineHeight: "1.65rem" }],
        lg: ["1.1875rem", { lineHeight: "1.75rem" }],
        caption: ["0.875rem", { lineHeight: "1.4" }],
        body: ["1.0625rem", { lineHeight: "1.6" }],
        "body-lg": ["1.25rem", { lineHeight: "1.55" }],
        h3: ["1.5rem", { lineHeight: "1.3", fontWeight: "700" }],
        h2: ["2rem", { lineHeight: "1.25", fontWeight: "800" }],
        h1: ["2.75rem", { lineHeight: "1.15", fontWeight: "800" }],
      },
      spacing: {
        18: "4.5rem",
      },
    },
  },
  plugins: [],
};
