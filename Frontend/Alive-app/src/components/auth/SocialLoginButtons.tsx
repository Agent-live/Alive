import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store'
import { GoogleIcon, AppleIcon, WeChatIcon, XTwitterIcon } from '../icons'
import { Loader2Icon } from '../icons'
import type { SocialLoginProvider } from '@/types'

interface SocialLoginButtonsProps {
  compact?: boolean
  onSuccess?: () => void
}

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

  const handleSocialLogin = async (provider: SocialLoginProvider) => {
    if (loadingProvider) return
    setLoadingProvider(provider)
    try {
      const success = await socialLogin(provider)
      if (success) {
        onSuccess?.()
      }
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
