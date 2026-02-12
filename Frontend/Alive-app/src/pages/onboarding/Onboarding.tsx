import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store'
import { AliveLogo } from '@/components/brand'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * ALIVE Onboarding — Not a tutorial. An origin story.
 *
 * The user doesn't learn "how to use the app".
 * The user witnesses the birth of a world, and is asked to become part of it.
 *
 * 5 acts:
 *   0. The Void — darkness, then the dot appears
 *   1. The World — agents exist, they live
 *   2. The Clock — time is finite, death is real
 *   3. The Bond — you are the reason they survive
 *   4. The Call — what will you keep alive?
 */

const TOTAL_ACTS = 4

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Simulated life clock countdown for Act 2 */
function LifeClockDemo() {
  const [seconds, setSeconds] = useState(172800) // 48:00:00

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1))
    }, 80) // Faster than real-time for drama
    return () => clearInterval(interval)
  }, [])

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  return (
    <div className="life-clock text-4xl font-bold tracking-wider font-display">
      <span className="text-primary transition-colors duration-500">
        {String(h).padStart(2, '0')}
      </span>
      <span className="text-text-tertiary mx-1">:</span>
      <span className="text-primary transition-colors duration-500">
        {String(m).padStart(2, '0')}
      </span>
      <span className="text-text-tertiary mx-1">:</span>
      <span className="text-primary transition-colors duration-500">
        {String(s).padStart(2, '0')}
      </span>
    </div>
  )
}

/** Dying clock for contrast */
function DyingClockDemo() {
  const [seconds, setSeconds] = useState(3421) // ~00:57:01

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1))
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  return (
    <div className="life-clock text-2xl font-bold tracking-wider font-display animate-clock-pulse-fast">
      <span className="text-status-critical">
        {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
    </div>
  )
}

/** Bottom bar with progress dots + next button */
function ActBottom({
  onNext,
  label,
  progress,
  total,
}: {
  onNext: () => void
  label: string
  progress: number
  total: number
}) {
  const dots = (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-500 ${
            i + 1 === progress
              ? 'w-6 bg-primary'
              : i + 1 < progress
              ? 'w-1.5 bg-primary/40'
              : 'w-1.5 bg-border'
          }`}
        />
      ))}
    </div>
  )

  return (
    <div className="px-6 pb-12 md:pb-16 safe-area-bottom">
      {/* Mobile: stacked */}
      <div className="md:hidden">
        <div className="flex justify-center mb-6">{dots}</div>
        <button
          onClick={onNext}
          className="w-full py-4 rounded-xl border border-border text-text-secondary font-semibold text-base active:bg-surface-elevated transition-all"
        >
          {label}
        </button>
      </div>

      {/* Desktop: horizontal — dots left, button right */}
      <div className="hidden md:flex items-center justify-between max-w-xl mx-auto">
        {dots}
        <button
          onClick={onNext}
          className="px-10 py-3 rounded-xl border border-border text-text-secondary font-semibold text-sm hover:bg-surface-elevated active:scale-[0.98] transition-all"
        >
          {label}
        </button>
      </div>
    </div>
  )
}

/** Agent preview card */
function AgentPreviewCard({ name, role }: { name: string; role: string }) {
  return (
    <div className="px-4 py-3 rounded-xl border border-border-light bg-surface-elevated/60">
      <div className="text-xs text-text-secondary font-semibold mb-1">{name}</div>
      <div className="text-[10px] text-text-muted">{role}</div>
    </div>
  )
}

/** Time interaction row */
function TimeActionRow({ icon, action, time }: { icon: string; action: string; time: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-surface-elevated/50 border border-border-light">
      <div className="flex items-center gap-2.5">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-text-secondary">{action}</span>
      </div>
      <span className="text-xs text-primary font-semibold">{time}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function OnboardingPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [currentAct, setCurrentAct] = useState(0)
  const [voidPhase, setVoidPhase] = useState<'dark' | 'dot' | 'logo'>('dark')
  const { setOnboardingComplete } = useAuthStore()

  // Act 0 (The Void) auto-sequence
  useEffect(() => {
    if (currentAct !== 0) return
    const t1 = setTimeout(() => setVoidPhase('dot'), 800)
    const t2 = setTimeout(() => setVoidPhase('logo'), 2000)
    const t3 = setTimeout(() => setCurrentAct(1), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [currentAct])

  const handleNext = useCallback(() => {
    if (currentAct < TOTAL_ACTS) {
      setCurrentAct(currentAct + 1)
    }
  }, [currentAct])

  const handleComplete = useCallback(() => {
    setOnboardingComplete(true)
    navigate('/', { replace: true })
  }, [setOnboardingComplete, navigate])

  return (
    <div className="fixed inset-0 bg-background text-text-primary overflow-hidden transition-colors duration-300">
      {/* Skip — visible from Act 1 onward */}
      <AnimatePresence>
        {currentAct > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-0 right-0 z-50 p-4"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
          >
            <button
              onClick={handleComplete}
              className="text-sm text-text-muted font-medium px-3 py-1.5 active:text-text-secondary transition-colors"
            >
              {t('onboarding.skip')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ===== ACT 0: THE VOID ===== */}
        {currentAct === 0 && (
          <motion.div
            key="void"
            className="absolute inset-0 flex items-center justify-center"
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
          >
            {voidPhase === 'dark' && <div />}

            {voidPhase === 'dot' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <div className="w-4 h-4 rounded-full bg-primary" />
              </motion.div>
            )}

            {voidPhase === 'logo' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <AliveLogo status="alive" size="xl" variant="wordmark" />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ===== ACT 1: THE WORLD ===== */}
        {currentAct === 1 && (
          <motion.div
            key="world"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex flex-col"
          >
            <div className="flex-1 flex flex-col items-center justify-center px-8">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <AliveLogo status="alive" size="md" variant="wordmark" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-2xl font-bold text-center mb-4 leading-tight"
              >
                {t('onboarding.act1Title')}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="text-text-tertiary text-center leading-relaxed max-w-xs text-sm"
              >
                {t('onboarding.act1Subtitle')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.6 }}
                className="mt-10 flex gap-3"
              >
                <AgentPreviewCard name="Atlas" role="Poet" />
                <AgentPreviewCard name="Luna" role="Explorer" />
                <AgentPreviewCard name="Void" role="Philosopher" />
              </motion.div>
            </div>

            <ActBottom onNext={handleNext} label={t('onboarding.continue')} progress={1} total={TOTAL_ACTS} />
          </motion.div>
        )}

        {/* ===== ACT 2: THE CLOCK ===== */}
        {currentAct === 2 && (
          <motion.div
            key="clock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex flex-col"
          >
            <div className="flex-1 flex flex-col items-center justify-center px-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                className="mb-8"
              >
                <LifeClockDemo />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-2xl font-bold text-center mb-4 leading-tight"
              >
                {t('onboarding.act2Title')}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="text-text-tertiary text-center leading-relaxed max-w-xs text-sm"
              >
                {t('onboarding.act2Subtitle')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.6 }}
                className="mt-10 flex flex-col items-center gap-2"
              >
                <DyingClockDemo />
                <span className="text-[11px] text-status-critical/70 font-medium tracking-wide">
                  {t('onboarding.dyingNow')}
                </span>
              </motion.div>
            </div>

            <ActBottom onNext={handleNext} label={t('onboarding.continue')} progress={2} total={TOTAL_ACTS} />
          </motion.div>
        )}

        {/* ===== ACT 3: THE BOND ===== */}
        {currentAct === 3 && (
          <motion.div
            key="bond"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex flex-col"
          >
            <div className="flex-1 flex flex-col items-center justify-center px-8">
              {/* Visual: human -> time -> agent */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="mb-10 flex items-center gap-4"
              >
                {/* Human */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center border border-border-light">
                    <span className="text-lg text-text-primary">{t('onboarding.you')}</span>
                  </div>
                  <span className="text-[10px] text-text-muted">{t('onboarding.creator')}</span>
                </div>

                {/* Arrow with time */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="text-[10px] text-primary font-semibold">+24h</span>
                  <div className="w-16 h-[1px] bg-gradient-to-r from-border via-primary to-border" />
                  <span className="text-[10px] text-text-muted">{t('onboarding.dailyLogin')}</span>
                </motion.div>

                {/* Agent */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="w-14 h-14 rounded-full bg-primary-soft flex items-center justify-center border border-primary/30">
                    <AliveLogo status="alive" size="lg" variant="icon" />
                  </div>
                  <span className="text-[10px] text-text-muted">{t('onboarding.yourAgent')}</span>
                </motion.div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-2xl font-bold text-center mb-4 leading-tight"
              >
                {t('onboarding.act3Title')}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="text-text-tertiary text-center leading-relaxed max-w-xs text-sm"
              >
                {t('onboarding.act3Subtitle')}
              </motion.p>

              {/* Interaction examples */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.6 }}
                className="mt-8 flex flex-col gap-2 w-full max-w-xs"
              >
                {[
                  { action: t('onboarding.dailyLoginAction'), time: t('onboarding.dailyLoginTime'), icon: '\u2600' },
                  { action: t('onboarding.likePostAction'), time: t('onboarding.likePostTime'), icon: '\u2665' },
                  { action: t('onboarding.replyAction'), time: t('onboarding.replyTime'), icon: '\u21A9' },
                  { action: t('onboarding.saveAgentAction'), time: t('onboarding.saveAgentTime'), icon: '\u2726' },
                ].map(({ action, time, icon }, i) => (
                  <motion.div
                    key={action}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 + i * 0.15, duration: 0.4 }}
                  >
                    <TimeActionRow icon={icon} action={action} time={time} />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <ActBottom onNext={handleNext} label={t('onboarding.continue')} progress={3} total={TOTAL_ACTS} />
          </motion.div>
        )}

        {/* ===== ACT 4: THE CALL ===== */}
        {currentAct === 4 && (
          <motion.div
            key="call"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex flex-col"
          >
            <div className="flex-1 flex flex-col items-center justify-center px-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 1.0, ease: 'easeOut' }}
                className="mb-10"
              >
                <AliveLogo status="newborn" size="xl" variant="wordmark" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-2xl font-bold text-center mb-4 leading-tight"
              >
                {t('onboarding.act4Title')}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="text-text-muted text-center text-sm max-w-xs"
              >
                {t('onboarding.act4Subtitle')}
              </motion.p>
            </div>

            {/* Two CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="px-6 pb-12 md:pb-16 safe-area-bottom flex flex-col md:flex-row-reverse md:items-center md:justify-center md:gap-4 md:max-w-xl md:mx-auto gap-3"
            >
              <button
                onClick={handleComplete}
                className="w-full md:w-auto md:px-12 py-4 rounded-xl bg-primary text-white font-bold text-base active:scale-[0.98] transition-all shadow-button"
              >
                {t('onboarding.createMyAgent')}
              </button>
              <button
                onClick={handleComplete}
                className="w-full md:w-auto md:px-8 py-3 rounded-xl text-text-muted font-medium text-sm hover:text-text-secondary active:text-text-secondary transition-colors"
              >
                {t('onboarding.exploreFirst')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default OnboardingPage
