import type { Config } from "tailwindcss";

/**
 * Only the options and onboarding pages compile Tailwind (see src/options/options.css).
 * The in-page widget ships its own hand-written CSS because it lives in a shadow root
 * on a third-party page and cannot rely on a utility layer being present.
 *
 * Colours resolve to CSS variables declared in options.css so light/dark comes from
 * one place and matches the widget's palette exactly.
 */
export default {
  content: ["./src/options/**/*.{ts,tsx,html}", "./src/onboarding/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface)",
        sunken: "var(--sunken)",
        raised: "var(--raised)",
        hairline: "var(--hairline)",
        "hairline-strong": "var(--hairline-strong)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        "ink-faint": "var(--ink-faint)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        "accent-soft": "var(--accent-soft)",
        positive: "var(--positive)",
        "positive-soft": "var(--positive-soft)",
        critical: "var(--critical)",
        "critical-soft": "var(--critical-soft)",
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "primary-ink": "var(--primary-ink)",
      },
      // A 7-step scale. Everything on these pages uses one of these sizes.
      fontSize: {
        xs: ["12px", "16px"],
        sm: ["13px", "20px"],
        base: ["15px", "24px"],
        lg: ["17px", "24px"],
        xl: ["20px", "28px"],
        "2xl": ["26px", "32px"],
        "3xl": ["32px", "40px"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        card: "0 1px 2px rgb(16 20 28 / 0.05)",
        raised: "0 1px 2px rgb(16 20 28 / 0.06), 0 8px 24px rgb(16 20 28 / 0.08)",
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
} satisfies Config;
