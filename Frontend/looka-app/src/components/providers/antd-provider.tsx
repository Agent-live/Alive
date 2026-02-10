
import { ConfigProvider } from "antd"
import type React from "react"

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "var(--color-primary)",
          colorInfo: "var(--color-info)",
          colorSuccess: "var(--color-success)",
          colorWarning: "var(--color-warning)",
          colorError: "var(--color-error)",
          colorBgLayout: "var(--color-bg)",
          colorBgContainer: "var(--color-surface)",
          colorBgElevated: "var(--color-surface-elevated)",
          colorText: "var(--color-text-primary)",
          colorTextSecondary: "var(--color-text-secondary)",
          colorBorder: "var(--color-border)",
          borderRadius: 8,
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}
