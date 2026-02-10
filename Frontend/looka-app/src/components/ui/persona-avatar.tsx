/**
 * PersonaAvatar - 统一的 Persona 头像显示组件
 *
 * 功能：
 * 1. 优先显示 AI 生成的头像图片
 * 2. 图片加载失败或不存在时显示 fallback（icon_text + 渐变背景）
 * 3. 内置图片缓存状态管理
 * 4. 支持不同尺寸和样式
 */

import { useState, useEffect, useMemo } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { User } from "lucide-react"
import { normalizeAvatarUrl } from "@/lib/api/user"
import type { Persona } from "@/api/types"
import { cn } from "@/lib/utils"

// 全局头像缓存：记录已加载成功/失败的头像 URL
const avatarCache = new Map<string, "loaded" | "error">()

interface PersonaAvatarProps {
  /** Persona 对象 */
  persona?: Persona | null
  /** 直接传入头像 URL（优先级低于 persona.avatar） */
  avatarUrl?: string | null
  /** 用户头像 URL（当 persona 和 avatarUrl 都没有时使用，用于自定义问题） */
  userAvatarUrl?: string | null
  /** 备用显示文本（当没有 persona 时使用） */
  fallbackText?: string
  /** 备用渐变色起始色 */
  fallbackColorStart?: string
  /** 备用渐变色结束色 */
  fallbackColorEnd?: string
  /** 尺寸：xs=5, sm=8, md=10, lg=12, xl=16 */
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  /** 自定义 className */
  className?: string
  /** 是否显示圆角矩形（默认 true） */
  rounded?: "xl" | "full"
}

const sizeClasses = {
  xs: "w-5 h-5",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
}

const textSizeClasses = {
  xs: "text-[8px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
  xl: "text-lg",
}

const iconSizeClasses = {
  xs: "w-2.5 h-2.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-5 h-5",
  xl: "w-7 h-7",
}

export function PersonaAvatar({
  persona,
  avatarUrl: directAvatarUrl,
  userAvatarUrl,
  fallbackText,
  fallbackColorStart,
  fallbackColorEnd,
  size = "md",
  className,
  rounded = "xl",
}: PersonaAvatarProps) {
  // 确定头像 URL（优先级：persona.avatar > directAvatarUrl > userAvatarUrl）
  const avatarUrl = useMemo(() => {
    const url = persona?.avatar || directAvatarUrl || userAvatarUrl
    return url ? normalizeAvatarUrl(url) : null
  }, [persona?.avatar, directAvatarUrl, userAvatarUrl])

  // 头像加载状态
  const [imageStatus, setImageStatus] = useState<"loading" | "loaded" | "error">(() => {
    if (!avatarUrl) return "error"
    const cached = avatarCache.get(avatarUrl)
    return cached || "loading"
  })

  // 当 URL 变化时重置状态
  useEffect(() => {
    if (!avatarUrl) {
      setImageStatus("error")
      return
    }
    const cached = avatarCache.get(avatarUrl)
    if (cached) {
      setImageStatus(cached)
    } else {
      setImageStatus("loading")
    }
  }, [avatarUrl])

  // 处理图片加载成功
  const handleImageLoad = () => {
    if (avatarUrl) {
      avatarCache.set(avatarUrl, "loaded")
    }
    setImageStatus("loaded")
  }

  // 处理图片加载失败
  const handleImageError = () => {
    if (avatarUrl) {
      avatarCache.set(avatarUrl, "error")
    }
    setImageStatus("error")
  }

  // Fallback 样式
  const fallbackStyle = useMemo(() => {
    const colorStart = persona?.color_start || fallbackColorStart
    const colorEnd = persona?.color_end || fallbackColorEnd || colorStart

    if (colorStart) {
      return {
        background: `linear-gradient(135deg, ${colorStart}, ${colorEnd})`,
        color: "white",
      }
    }
    return undefined
  }, [persona?.color_start, persona?.color_end, fallbackColorStart, fallbackColorEnd])

  // Fallback 文本
  const displayText = useMemo(() => {
    if (persona?.icon_text) return persona.icon_text
    if (fallbackText) return fallbackText.charAt(0)
    if (persona?.name_zh) return persona.name_zh.charAt(0)
    if (persona?.name_en) return persona.name_en.charAt(0)
    return null
  }, [persona?.icon_text, persona?.name_zh, persona?.name_en, fallbackText])

  const roundedClass = rounded === "full" ? "rounded-full" : "rounded"
  const shouldShowImage = avatarUrl && imageStatus !== "error"

  return (
    <Avatar className={cn(sizeClasses[size], roundedClass, "shadow-sm", className)}>
      {shouldShowImage && (
        <AvatarImage
          src={avatarUrl}
          alt={persona?.name_zh || persona?.name_en || fallbackText || "Avatar"}
          className="object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      <AvatarFallback
        className={cn(
          roundedClass,
          textSizeClasses[size],
          "font-medium",
          !fallbackStyle && "bg-muted text-muted-foreground"
        )}
        style={fallbackStyle}
      >
        {displayText || <User className={iconSizeClasses[size]} />}
      </AvatarFallback>
    </Avatar>
  )
}

/**
 * 清除头像缓存
 * 可在用户更新头像后调用
 */
export function clearAvatarCache(url?: string) {
  if (url) {
    avatarCache.delete(normalizeAvatarUrl(url))
  } else {
    avatarCache.clear()
  }
}

/**
 * 预加载头像
 * 可在页面加载时批量预加载
 */
export function preloadAvatars(urls: (string | undefined | null)[]) {
  urls.forEach((url) => {
    if (!url) return
    const normalizedUrl = normalizeAvatarUrl(url)
    if (avatarCache.has(normalizedUrl)) return

    const img = new Image()
    img.onload = () => avatarCache.set(normalizedUrl, "loaded")
    img.onerror = () => avatarCache.set(normalizedUrl, "error")
    img.src = normalizedUrl
  })
}
