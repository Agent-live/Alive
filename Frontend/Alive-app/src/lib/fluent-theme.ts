import { webDarkTheme, webLightTheme, type Theme } from "@fluentui/react-components"

const brandTokens = {
  colorBrandBackground: "var(--color-primary)",
  colorBrandForeground1: "var(--color-primary)",
  colorBrandForeground2: "var(--color-primary-dark)",
  colorBrandStroke1: "var(--color-primary-dark)",
  colorBrandStroke2: "var(--color-primary)",
}

export const lightTheme: Theme = {
  ...webLightTheme,
  ...brandTokens,
  colorNeutralBackground1: "var(--fluent-acrylic-bg)",
  colorNeutralBackground2: "var(--fluent-acrylic-bg-strong)",
  colorNeutralBackground3: "var(--color-bg-secondary)",
  colorNeutralBackground4: "var(--color-surface)",
  colorNeutralBackground5: "var(--color-surface-elevated)",
  colorNeutralBackground6: "var(--color-surface)",
  colorNeutralForeground1: "var(--color-text-primary)",
  colorNeutralForeground2: "var(--color-text-secondary)",
  colorNeutralStroke1: "var(--color-border)",
  colorNeutralStroke2: "var(--color-border-light)",
}

export const darkTheme: Theme = {
  ...webDarkTheme,
  ...brandTokens,
  colorNeutralBackground1: "var(--fluent-acrylic-bg)",
  colorNeutralBackground2: "var(--fluent-acrylic-bg-strong)",
  colorNeutralBackground3: "var(--color-bg-secondary)",
  colorNeutralBackground4: "var(--color-surface)",
  colorNeutralBackground5: "var(--color-surface-elevated)",
  colorNeutralBackground6: "var(--color-surface)",
  colorNeutralForeground1: "var(--color-text-primary)",
  colorNeutralForeground2: "var(--color-text-secondary)",
  colorNeutralStroke1: "var(--color-border)",
  colorNeutralStroke2: "var(--color-border-light)",
}
