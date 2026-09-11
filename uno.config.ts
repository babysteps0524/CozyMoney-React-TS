import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWind4,
} from "unocss";
export default defineConfig({
  presets: [
    presetWind4(),
    presetAttributify(),
    presetIcons(),
    presetTypography(),
  ],
  theme: {
    colors: {
      cm: {
        bg: "#f7f8fa",
        surface: "#fff",
        surface2: "#f1f4f7",
        text: "#18212b",
        muted: "#66717d",
        line: "#dce2e8",
        primary: "#174a5b",
        accent: "#2a9d8f",
        gold: "#e9c46a",
        Logo: "oklch(0.66796 0.14628 52.09)"
      },
    },
  },
  shortcuts: {
    page: "mx-auto w-full max-w-1200px px-4 md:px-6",
    surface: "bg-cm-surface border border-cm-line rounded-3xl shadow-sm",
    focusRing:
      "focus-visible:outline-3 focus-visible:outline-cm-accent focus-visible:outline-offset-2",
    buttonPrimary:
      "inline-flex items-center justify-center min-h-11 rounded-xl px-4 bg-cm-primary text-white font-700 hover:opacity-90",
  },
});
