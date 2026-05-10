/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        surface: "#12121a",
        panel: "#1a1a26",
        border: "#2a2a3d",
        cyan: { DEFAULT: "#00f5ff", dim: "#00c8d4", glow: "rgba(0,245,255,0.15)" },
        purple: { DEFAULT: "#8b00ff", dim: "#6b00cc", glow: "rgba(139,0,255,0.15)" },
        neon: { green: "#00ff88", orange: "#ff6b00" },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      boxShadow: {
        "cyan-glow": "0 0 20px rgba(0,245,255,0.3), 0 0 60px rgba(0,245,255,0.1)",
        "purple-glow": "0 0 20px rgba(139,0,255,0.3), 0 0 60px rgba(139,0,255,0.1)",
        "neon-sm": "0 0 8px rgba(0,245,255,0.5)",
      },
      backgroundImage: {
        "gradient-cyber": "linear-gradient(135deg, #00f5ff, #8b00ff)",
        "gradient-cyber-dim": "linear-gradient(135deg, rgba(0,245,255,0.15), rgba(139,0,255,0.15))",
        "grid-pattern":
          "linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-sm": "40px 40px",
      },
      animation: {
        "particle-float": "particleFloat 8s ease-in-out infinite",
        "pulse-cyan": "pulseCyan 2s ease-in-out infinite",
        "border-run": "borderRun 3s linear infinite",
        "fade-up": "fadeUp 0.5s ease forwards",
        "slide-in": "slideIn 0.3s ease forwards",
        glow: "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        particleFloat: {
          "0%, 100%": { transform: "translateY(0) scale(1)", opacity: "0.6" },
          "50%": { transform: "translateY(-30px) scale(1.1)", opacity: "1" },
        },
        pulseCyan: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(0,245,255,0.4)" },
          "50%": { boxShadow: "0 0 20px rgba(0,245,255,0.8)" },
        },
        borderRun: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
