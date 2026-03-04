import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast, useAuthStore } from '@/store'
import { GoogleIcon, AppleIcon, WeChatIcon, XTwitterIcon } from '../icons'
import { Loader2Icon } from '../icons'
import type { SocialLoginProvider } from '@/types'

interface SocialLoginButtonsProps {
  compact?: boolean
  onSuccess?: () => void
}

const GOOGLE_GIS_SCRIPT_ID = 'alive-google-gis'
const GOOGLE_GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

type GoogleCredentialResponse = {
  credential?: string
}

type GooglePromptMomentNotification = {
  isNotDisplayed: () => boolean
  isSkippedMoment: () => boolean
  getNotDisplayedReason: () => string
  getSkippedReason: () => string
}

type GoogleIDClient = {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    auto_select?: boolean
    ux_mode?: 'popup' | 'redirect'
    cancel_on_tap_outside?: boolean
  }) => void
  prompt: (listener?: (notification: GooglePromptMomentNotification) => void) => void
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleIDClient
      }
    }
  }
}

let googleGISLoader: Promise<void> | null = null

const providers: { id: SocialLoginProvider; label: string; icon: typeof GoogleIcon; className: string }[] = [
  {
    id: 'google',
    label: 'Google',
    icon: GoogleIcon,
    className: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700',
  },
  {
    id: 'apple',
    label: 'Apple',
    icon: AppleIcon,
    className: 'bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100',
  },
  {
    id: 'wechat',
    label: 'WeChat',
    icon: WeChatIcon,
    className: 'bg-[#07C160] text-white hover:bg-[#06ae56]',
  },
  {
    id: 'twitter',
    label: 'X',
    icon: XTwitterIcon,
    className: 'bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100',
  },
]

export function SocialLoginButtons({ compact = false, onSuccess }: SocialLoginButtonsProps) {
  const { t } = useTranslation()
  const { socialLogin } = useAuthStore()
  const [loadingProvider, setLoadingProvider] = useState<SocialLoginProvider | null>(null)

  const getGoogleClientId = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
    return clientId?.trim() || ''
  }

  const ensureGoogleGIS = async () => {
    if (window.google?.accounts?.id) {
      return
    }
    if (!googleGISLoader) {
      googleGISLoader = new Promise<void>((resolve, reject) => {
        const existing = document.getElementById(GOOGLE_GIS_SCRIPT_ID) as HTMLScriptElement | null
        if (existing) {
          if (existing.dataset.loaded === '1') {
            resolve()
            return
          }
          existing.addEventListener('load', () => resolve(), { once: true })
          existing.addEventListener('error', () => reject(new Error('Google script load failed')), { once: true })
          return
        }

        const script = document.createElement('script')
        script.id = GOOGLE_GIS_SCRIPT_ID
        script.src = GOOGLE_GIS_SCRIPT_SRC
        script.async = true
        script.defer = true
        script.onload = () => {
          script.dataset.loaded = '1'
          resolve()
        }
        script.onerror = () => reject(new Error('Google script load failed'))
        document.head.appendChild(script)
      })
    }
    try {
      await googleGISLoader
    } catch (error) {
      googleGISLoader = null
      throw error
    }
    if (!window.google?.accounts?.id) {
      throw new Error('Google Identity Services unavailable')
    }
  }

  const requestGoogleIdToken = async () => {
    const clientId = getGoogleClientId()
    if (!clientId) {
      throw new Error('Google login is not configured')
    }

    await ensureGoogleGIS()

    return new Promise<string>((resolve, reject) => {
      let settled = false
      const id = window.google?.accounts?.id
      if (!id) {
        reject(new Error('Google Identity Services unavailable'))
        return
      }

      id.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: (response) => {
          if (settled) return
          settled = true
          const credential = response.credential?.trim()
          if (!credential) {
            reject(new Error('Google token is empty'))
            return
          }
          resolve(credential)
        },
      })

      id.prompt((notification) => {
        if (settled) return
        if (notification.isNotDisplayed()) {
          settled = true
          reject(new Error(`Google login unavailable: ${notification.getNotDisplayedReason()}`))
          return
        }
        if (notification.isSkippedMoment()) {
          settled = true
          reject(new Error(`Google login skipped: ${notification.getSkippedReason()}`))
        }
      })
    })
  }

  const handleSocialLogin = async (provider: SocialLoginProvider) => {
    if (loadingProvider) return
    setLoadingProvider(provider)
    try {
      const payload =
        provider === 'google'
          ? {
              provider,
              idToken: await requestGoogleIdToken(),
            }
          : { provider }
      const success = await socialLogin(payload)
      if (success) {
        toast.success(t('auth.loginSuccess', 'Login successful'))
        onSuccess?.()
      } else {
        toast.error(t('auth.loginFailed', 'Login failed'))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      toast.error(message)
    } finally {
      setLoadingProvider(null)
    }
  }

  const iconSize = compact ? 20 : 20

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2.5">
        {providers.map((p) => {
          const IconComp = p.icon
          const isLoading = loadingProvider === p.id
          return (
            <button
              key={p.id}
              onClick={() => handleSocialLogin(p.id)}
              disabled={!!loadingProvider}
              className={`
                h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2
                transition-all duration-200 active:scale-[0.98] disabled:opacity-60
                ${p.className}
              `}
            >
              {isLoading ? (
                <Loader2Icon width={iconSize} height={iconSize} className="animate-spin" />
              ) : (
                <IconComp width={iconSize} height={iconSize} />
              )}
              {p.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {providers.map((p) => {
        const IconComp = p.icon
        const isLoading = loadingProvider === p.id
        return (
          <button
            key={p.id}
            onClick={() => handleSocialLogin(p.id)}
            disabled={!!loadingProvider}
            className={`
              w-full h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2.5
              transition-all duration-200 active:scale-[0.98] disabled:opacity-60
              ${p.className}
            `}
          >
            {isLoading ? (
              <Loader2Icon width={iconSize} height={iconSize} className="animate-spin" />
            ) : (
              <IconComp width={iconSize} height={iconSize} />
            )}
            {t('auth.continueWith', { provider: p.label })}
          </button>
        )
      })}
    </div>
  )
}

export function LoginDivider({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const py = compact ? 'py-3' : 'py-4'
  return (
    <div className={`flex items-center gap-3 ${py}`}>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      <span className="text-xs text-gray-400 font-medium">{t('common.or')}</span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}
