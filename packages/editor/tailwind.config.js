/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: "#1e1e1e",
          panel: "#252526",
          panelAlt: "#2b2b2b",
          panelHover: "#333333",
          border: "#3e3e42",
          text: "#cccccc",
          muted: "#858585",
          accent: "#094771",
          accentHover: "#0e639c",
          selection: "#1d4ed8",
          selectionHover: "#2f6fe0",
          green: "#3d7a3d",
          greenHover: "#4a8c4a",
        },
      },
      fontSize: {
        xxs: "10px",
      },
      boxShadow: {
        "dock-selected": "0 0 0 1px #0e639c",
      },
    },
  },
  plugins: [],
};
