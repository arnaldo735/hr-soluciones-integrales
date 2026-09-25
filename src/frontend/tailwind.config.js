import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "oklch(var(--success) / <alpha-value>)",
          foreground: "oklch(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "oklch(var(--warning) / <alpha-value>)",
          foreground: "oklch(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "oklch(var(--info) / <alpha-value>)",
          foreground: "oklch(var(--info-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground))",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
          group: "oklch(var(--sidebar-group))",
          "group-foreground": "oklch(var(--sidebar-group-foreground))",
          child: "oklch(var(--sidebar-child))",
          "child-foreground": "oklch(var(--sidebar-child-foreground))",
        },
        counter: {
          DEFAULT: "oklch(var(--counter))",
          foreground: "oklch(var(--counter-foreground))",
          border: "oklch(var(--counter-border))",
        },
        sheet: {
          DEFAULT: "oklch(var(--sheet))",
          foreground: "oklch(var(--sheet-foreground))",
          border: "oklch(var(--sheet-border))",
          muted: "oklch(var(--sheet-muted))",
        },
        calendar: {
          grid: "oklch(var(--calendar-grid))",
          today: "oklch(var(--calendar-today))",
          weekend: "oklch(var(--calendar-weekend))",
        },
        status: {
          draft: "oklch(var(--status-draft))",
          "draft-foreground": "oklch(var(--status-draft-foreground))",
          sent: "oklch(var(--status-sent))",
          "sent-foreground": "oklch(var(--status-sent-foreground))",
          accepted: "oklch(var(--status-accepted))",
          "accepted-foreground": "oklch(var(--status-accepted-foreground))",
          pending: "oklch(var(--status-pending))",
          "pending-foreground": "oklch(var(--status-pending-foreground))",
          rejected: "oklch(var(--status-rejected))",
          "rejected-foreground": "oklch(var(--status-rejected-foreground))",
          expired: "oklch(var(--status-expired))",
          "expired-foreground": "oklch(var(--status-expired-foreground))",
          cancelled: "oklch(var(--status-cancelled))",
          "cancelled-foreground": "oklch(var(--status-cancelled-foreground))",
          scheduled: "oklch(var(--status-scheduled))",
          "scheduled-foreground": "oklch(var(--status-scheduled-foreground))",
          confirmed: "oklch(var(--status-confirmed))",
          "confirmed-foreground": "oklch(var(--status-confirmed-foreground))",
          attended: "oklch(var(--status-attended))",
          "attended-foreground": "oklch(var(--status-attended-foreground))",
          noshow: "oklch(var(--status-noshow))",
          "noshow-foreground": "oklch(var(--status-noshow-foreground))",
          open: "oklch(var(--status-open))",
          "open-foreground": "oklch(var(--status-open-foreground))",
          overdue: "oklch(var(--status-overdue))",
          "overdue-foreground": "oklch(var(--status-overdue-foreground))",
          settled: "oklch(var(--status-settled))",
          "settled-foreground": "oklch(var(--status-settled-foreground))",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.06)",
        "subtle": "0 1px 2px 0 rgb(0 0 0 / 0.06), 0 0 0 1px rgb(0 0 0 / 0.04)",
        "elevated":
          "0 4px 12px -2px rgb(0 0 0 / 0.12), 0 2px 4px -2px rgb(0 0 0 / 0.08)",
        "panel": "0 1px 0 0 rgb(255 255 255 / 0.03) inset",
        "rail": "2px 0 0 0 oklch(var(--primary))",
        "sheet": "0 8px 28px -6px rgb(0 0 0 / 0.35), 0 2px 6px -2px rgb(0 0 0 / 0.2)",
        "counter": "0 1px 0 0 rgb(255 255 255 / 0.04) inset",
        "shortcut":
          "0 1px 2px -1px rgb(0 0 0 / 0.10), 0 0 0 1px rgb(0 0 0 / 0.03)",
        "company":
          "0 2px 10px -4px rgb(0 0 0 / 0.14), 0 0 0 1px rgb(0 0 0 / 0.04)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-low": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        "cart-line-in": {
          from: { opacity: "0", transform: "translateX(8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "cart-line-out": {
          from: { opacity: "1", transform: "translateX(0)" },
          to: { opacity: "0", transform: "translateX(8px)" },
        },
        "scan-flash": {
          "0%": { opacity: "0.55" },
          "100%": { opacity: "0" },
        },
        "sheet-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.99)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "shortcut-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "rail-draw": {
          from: { transform: "scaleY(0)" },
          to: { transform: "scaleY(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.25s cubic-bezier(0.4, 0, 0.2, 1) both",
        "slide-in-left": "slide-in-left 0.25s cubic-bezier(0.4, 0, 0.2, 1) both",
        "pulse-low": "pulse-low 1.8s ease-in-out infinite",
        "cart-line-in": "cart-line-in 0.18s cubic-bezier(0.4, 0, 0.2, 1) both",
        "cart-line-out": "cart-line-out 0.15s ease-in both",
        "scan-flash": "scan-flash 0.4s ease-out both",
        "sheet-in": "sheet-in 0.22s cubic-bezier(0.4, 0, 0.2, 1) both",
        "shortcut-in": "shortcut-in 0.26s cubic-bezier(0.4, 0, 0.2, 1) both",
        "rail-draw": "rail-draw 0.3s cubic-bezier(0.4, 0, 0.2, 1) both",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
