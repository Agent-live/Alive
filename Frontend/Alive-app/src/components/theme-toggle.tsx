import * as React from "react"
import { useTheme } from "@/lib/theme-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"

// 简单的图标组件
function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

function MonitorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  )
}

interface ThemeToggleProps {
  collapsed?: boolean
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { t } = useI18n()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
        <MonitorIcon className="h-4 w-4" />
        {!collapsed && <span>{t("settings.appearance.theme")}</span>}
      </Button>
    )
  }

  const isLight = resolvedTheme === "light"

  // In collapsed mode, show a single toggle button
  if (collapsed) {
    // 循环切换: light -> dark -> system -> light
    const toggleTheme = () => {
      if (theme === "light") setTheme("dark")
      else if (theme === "dark") setTheme("system")
      else setTheme("light")
    }

    // 根据实际主题显示图标
    const Icon = theme === "system" ? MonitorIcon : (isLight ? SunIcon : MoonIcon)
    const title = theme === "system"
      ? t("settings.appearance.system")
      : (isLight ? t("settings.appearance.light") : t("settings.appearance.dark"))

    return (
      <button
        onClick={toggleTheme}
        title={title}
        className={cn(
          "relative w-10 h-10 rounded-full p-0 flex items-center justify-center overflow-hidden fluent-transition",
          isLight
            ? "bg-white/60 border border-black/[0.08] shadow-sm text-primary hover:bg-white/80"
            : "border border-white/[0.1] text-sidebar-foreground hover:text-primary"
        )}
        style={!isLight ? {
          boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        } : undefined}
      >
        {/* Dark mode: Glassmorphism layers */}
        {!isLight && (
          <>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backdropFilter: 'blur(12px) saturate(140%)',
                WebkitBackdropFilter: 'blur(12px) saturate(140%)',
                borderRadius: 'inherit',
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: 'rgba(var(--acrylic-tint), 0.35)',
                borderRadius: 'inherit',
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
                borderRadius: 'inherit',
              }}
            />
          </>
        )}
        {/* Icon */}
        <Icon className="h-4 w-4 flex-shrink-0 relative z-10" />
      </button>
    )
  }

  // In expanded mode, show both options
  const ThemeButton = ({
    isActive,
    onClick,
    icon: Icon,
    label
  }: {
    isActive: boolean
    onClick: () => void
    icon: React.FC<React.SVGProps<SVGSVGElement>>
    label: string
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "relative flex-1 flex items-center justify-center gap-2 py-2 rounded overflow-hidden fluent-transition",
        isActive
          ? isLight
            ? "bg-white/70 border border-black/[0.08] shadow-sm text-primary"
            : "text-primary border border-white/[0.1]"
          : "text-sidebar-foreground hover:bg-sidebar-accent border border-transparent"
      )}
      style={isActive && !isLight ? {
        boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      } : undefined}
    >
      {/* Dark mode: Glassmorphism layers for active state */}
      {isActive && !isLight && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backdropFilter: 'blur(12px) saturate(140%)',
              WebkitBackdropFilter: 'blur(12px) saturate(140%)',
              borderRadius: 'inherit',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: 'rgba(var(--acrylic-tint), 0.35)',
              borderRadius: 'inherit',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
              borderRadius: 'inherit',
            }}
          />
        </>
      )}
      {/* Content */}
      <Icon className="h-4 w-4 flex-shrink-0 relative z-10" />
      <span className="relative z-10">{label}</span>
    </button>
  )

  // 判断按钮是否应该高亮（active）
  // 如果 theme === "system"，则根据 resolvedTheme 高亮对应按钮
  const isLightActive = theme === "light" || (theme === "system" && resolvedTheme === "light")
  const isDarkActive = theme === "dark" || (theme === "system" && resolvedTheme === "dark")

  return (
    <div className="flex gap-2">
      <ThemeButton
        isActive={isLightActive}
        onClick={() => setTheme("light")}
        icon={SunIcon}
        label={t("settings.appearance.light")}
      />
      <ThemeButton
        isActive={isDarkActive}
        onClick={() => setTheme("dark")}
        icon={MoonIcon}
        label={t("settings.appearance.dark")}
      />
    </div>
  )
}
