import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '../common/Icon'
import { CodeInput, SendCodeButton } from './CodeInput'
import { SocialLoginButtons, LoginDivider } from './SocialLoginButtons'
import { useAuthStore, toast } from '@/store'
import { authApi } from '@/api/auth'
import { validatePhone, validateCode } from '@/utils/validators'

type Step = 'phone' | 'code'

export function LoginModal() {
  const { showLoginModal, closeLoginModal, login, loginRedirectPath } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [focused, setFocused] = useState(false)

  const isLoggingInRef = useRef(false)

  const handleLoginSuccess = () => {
    if (loginRedirectPath) {
      navigate(loginRedirectPath, { replace: true })
    }
    closeLoginModal()
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!showLoginModal) {
      setStep('phone')
      setPhone('')
      setCode('')
      setPhoneError('')
      setCodeError('')
      setLoading(false)
      setAgreed(false)
    }
  }, [showLoginModal])

  // Lock body scroll & ESC to close
  useEffect(() => {
    if (!showLoginModal) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLoginModal()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [showLoginModal, closeLoginModal])

  const formatPhone = (val: string): string => {
    if (val.length <= 3) return val
    if (val.length <= 7) return `${val.slice(0, 3)} ${val.slice(3)}`
    return `${val.slice(0, 3)} ${val.slice(3, 7)} ${val.slice(7)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11)
    setPhone(val)
    setPhoneError('')
  }

  const handlePhoneSubmit = async () => {
    const result = validatePhone(phone)
    if (!result.valid) {
      setPhoneError(result.message || '')
      return
    }
    if (!agreed) {
      toast.warning(t('auth.pleaseAgreeFirst'))
      return
    }
    setPhoneError('')
    setLoading(true)
    try {
      await authApi.sendCode(phone)
      toast.success(t('auth.codeSent'))
      setStep('code')
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.sendFailed')
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSendCode = async () => {
    await authApi.sendCode(phone)
    toast.success(t('auth.codeSent'))
  }

  const handleCodeSubmit = async () => {
    if (isLoggingInRef.current || loading) return
    const result = validateCode(code)
    if (!result.valid) {
      setCodeError(result.message || '')
      return
    }
    setCodeError('')
    setLoading(true)
    isLoggingInRef.current = true
    try {
      const success = await login(phone, code)
      if (success) {
        handleLoginSuccess()
      }
    } finally {
      setLoading(false)
      isLoggingInRef.current = false
    }
  }

  const handleCodeComplete = (completedCode: string) => {
    if (completedCode.length === 6) {
      handleCodeSubmit()
    }
  }

  const handleBack = () => {
    setStep('phone')
    setCode('')
    setCodeError('')
  }

  const isPhoneValid = phone.length === 11

  if (!showLoginModal) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in duration-150"
        onClick={closeLoginModal}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-[520px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-0">
            {step === 'code' ? (
              <button
                onClick={handleBack}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name="arrow_back" size={20} className="text-gray-500" />
              </button>
            ) : (
              <div className="w-8" />
            )}
            <button
              onClick={closeLoginModal}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Icon name="close" size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {step === 'phone' ? (
                  <>
                    {/* Logo & Title */}
                    <div className="pt-4 pb-6 text-center">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Icon name="auto_awesome" size={28} className="text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                        {t('auth.welcomeTitle')}
                      </h2>
                      <p className="text-gray-500 text-sm">
                        {t('auth.welcomeSubtitle')}
                      </p>
                    </div>

                    {/* Social Login */}
                    <SocialLoginButtons compact onSuccess={handleLoginSuccess} />
                    <LoginDivider compact />

                    {/* Phone input */}
                    <div className="mb-4">
                      <div
                        className={`
                          flex items-center h-12 px-4 rounded-xl transition-all duration-200 border
                          ${focused ? 'border-primary/40 surface-card shadow-sm' : 'surface-card'}
                          ${phoneError ? 'border-red-400' : ''}
                        `}
                      >
                        <div className="flex items-center gap-1 pr-3 border-r border-gray-200 dark:border-gray-700 mr-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">+86</span>
                          <Icon name="expand_more" className="text-base text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          value={formatPhone(phone)}
                          onChange={handlePhoneChange}
                          onFocus={() => setFocused(true)}
                          onBlur={() => setFocused(false)}
                          disabled={loading}
                          placeholder={t('auth.enterPhonePlaceholder')}
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
                          autoComplete="tel"
                          autoFocus
                        />
                        {phone && !loading && (
                          <button
                            type="button"
                            onClick={() => setPhone('')}
                            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          >
                            <Icon name="cancel" className="text-lg text-gray-400" />
                          </button>
                        )}
                      </div>
                      {phoneError && (
                        <p className="text-xs text-red-500 mt-1 px-1">{phoneError}</p>
                      )}
                    </div>

                    {/* Agreement */}
                    <div className="flex items-start gap-2.5 mb-5">
                      <button
                        onClick={() => setAgreed(!agreed)}
                        className={`
                          mt-0.5 w-[16px] h-[16px] rounded-full border-[1.5px] flex items-center justify-center
                          transition-all duration-200 flex-shrink-0
                          ${agreed ? 'bg-primary border-primary' : 'border-gray-300 hover:border-gray-400'}
                        `}
                      >
                        {agreed && <Icon name="check" className="text-[10px] text-white" />}
                      </button>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {t('auth.agreeToTerms')} <button className="text-primary font-medium">{t('auth.termsOfService')}</button> {t('auth.and')} <button className="text-primary font-medium">{t('auth.privacyPolicy')}</button>
                      </p>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handlePhoneSubmit}
                      disabled={!isPhoneValid || loading}
                      className={`
                        w-full h-11 rounded-xl font-bold text-sm transition-all duration-200
                        ${isPhoneValid && agreed
                          ? 'bg-primary text-white shadow-button hover:shadow-lg active:scale-[0.98]'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        }
                      `}
                    >
                      {loading ? t('auth.sending') : t('auth.getCode')}
                    </button>

                    {/* Dev mode hint */}
                    {import.meta.env.DEV && (
                      <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                        <p className="text-xs text-primary font-medium mb-0.5">{t('auth.devMode')}</p>
                        <p className="text-xs text-gray-500">
                          {t('auth.devModeHint')}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Code step */}
                    <div className="pt-4 pb-6 text-center">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                        {t('auth.enterCode')}
                      </h2>
                      <p className="text-gray-500 text-sm">
                        {t('auth.codeSentTo', { phoneStart: phone.slice(0, 3), phoneEnd: phone.slice(7) })}
                      </p>
                    </div>

                    <div className="mb-4">
                      <CodeInput
                        value={code}
                        onChange={(val) => { setCode(val); setCodeError('') }}
                        error={codeError}
                        disabled={loading}
                        autoFocus
                        onComplete={handleCodeComplete}
                      />
                    </div>

                    <div className="flex justify-center mb-5">
                      <SendCodeButton onSend={handleSendCode} />
                    </div>

                    <button
                      onClick={handleCodeSubmit}
                      disabled={code.length !== 6 || loading}
                      className={`
                        w-full h-11 rounded-xl font-bold text-sm transition-all duration-200
                        ${code.length === 6
                          ? 'bg-primary text-white shadow-button hover:shadow-lg active:scale-[0.98]'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        }
                      `}
                    >
                      {loading ? t('auth.loggingIn') : t('auth.login')}
                    </button>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <p className="text-center text-xs text-gray-400 mt-4">
              {t('auth.footerAgreement')}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
