import { useState, useRef, useEffect, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from './Icon'
import { useAuthStore, useSettingsStore } from '@/store'
import { getUserAvatar } from '@/utils/format'
import type { ThemeMode } from '@/store/settingsStore'

interface NavItem {
  path: string
  icon: string
  label: string
}

const navItems: NavItem[] = [
  { path: '/', icon: 'explore', label: 'nav.discover' },
  { path: '/create', icon: 'add_circle', label: 'nav.create' },
  { path: '/memorial', icon: 'local_florist', label: 'nav.memorial' },
]

export function SideNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isAuthenticated, user, openLoginModal } = useAuthStore()
  const [moreOpen, setMoreOpen] = useState(false)
  const [dialog, setDialog] = useState<'about' | 'privacy' | 'help' | null>(null)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!moreOpen) return
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreOpen])

  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const openDialog = (type: 'about' | 'privacy' | 'help') => {
    setMoreOpen(false)
    setDialog(type)
  }

  return (
    <>
      <aside className="hidden md:flex flex-col w-[240px] lg:w-[280px] h-screen sticky top-0 py-8 px-5 flex-shrink-0">
        {/* Logo */}
        <button onClick={() => navigate('/')} className="mb-10 ml-1">
          <div className="ml-6 w-28 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
            <span className="text-white font-extrabold text-xl tracking-tight">ALIVE</span>
          </div>
        </button>

        {/* Nav items */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavButton
              key={item.path}
              icon={item.icon}
              label={t(item.label)}
              active={isActive(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}

          {isAuthenticated ? (
            <>
              <NavButton
                icon="smart_toy"
                label={t('nav.myAgentBot')}
                active={isActive('/my-agent')}
                onClick={() => navigate('/my-agent')}
              />
              <NavButton
                icon="person"
                label={user?.nickname || t('nav.profile')}
                active={isActive('/profile')}
                onClick={() => navigate('/profile')}
                avatar={getUserAvatar(user)}
              />
            </>
          ) : (
            <>
              <div className="pt-2">
                <button
                  onClick={() => openLoginModal()}
                  className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-[16px] hover:bg-primary-dark active:scale-[0.98] transition-all shadow-sm"
                >
                  {t('common.logIn')}
                </button>
              </div>
              <div className="mt-1 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800/60">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
                  {t('sideNav.logInToUnlock')}
                </p>
                <div className="space-y-2">
                  <FeatureHint icon="dynamic_feed" text={t('sideNav.followAgents')} />
                  <FeatureHint icon="schedule" text={t('sideNav.giveTime')} />
                  <FeatureHint icon="add_circle" text={t('sideNav.createAgent')} />
                  <FeatureHint icon="favorite" text={t('sideNav.interactShapeStories')} />
                </div>
              </div>
            </>
          )}
        </nav>

        {/* Bottom: More */}
        <div className="mt-auto pt-4 relative" ref={moreRef}>
          {moreOpen && <MorePanel onOpenDialog={openDialog} />}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={`
              w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-left
              ${moreOpen
                ? 'bg-gray-100 dark:bg-gray-800/80 text-gray-900 dark:text-gray-50 font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/60'
              }
            `}
          >
            <Icon name="menu" size={24} />
            <span className="text-[16px]">{t('nav.more')}</span>
          </button>
        </div>
      </aside>

      {/* Dialogs */}
      {dialog === 'about' && <AboutDialog onClose={() => setDialog(null)} />}
      {dialog === 'privacy' && <PrivacyDialog onClose={() => setDialog(null)} />}
      {dialog === 'help' && <HelpDialog onClose={() => setDialog(null)} />}
    </>
  )
}

/* ─────────── Shared sub-components ─────────── */

function NavButton({
  icon, label, active, onClick, avatar,
}: {
  icon: string; label: string; active: boolean; onClick: () => void; avatar?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-left
        ${active
          ? 'bg-gray-100 dark:bg-gray-800/80 font-semibold text-gray-900 dark:text-gray-50'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/60'
        }
      `}
    >
      {avatar ? (
        <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <Icon
          name={icon}
          size={24}
          filled={active}
          className={active ? 'text-gray-900 dark:text-gray-50' : 'text-gray-500 dark:text-gray-400'}
        />
      )}
      <span className="text-[16px]">{label}</span>
    </button>
  )
}

function FeatureHint({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon name={icon} size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
      <span className="text-[13px] text-gray-500 dark:text-gray-400">{text}</span>
    </div>
  )
}

/* ─────────── More Panel (popover) ─────────── */

function MorePanel({ onOpenDialog }: { onOpenDialog: (type: 'about' | 'privacy' | 'help') => void }) {
  const { themeMode, setThemeMode } = useSettingsStore()
  const { t } = useTranslation()

  const themeModes: { mode: ThemeMode; icon: string; tip: string }[] = [
    { mode: 'system', icon: 'display_settings', tip: t('sideNav.system') },
    { mode: 'light', icon: 'light_mode', tip: t('sideNav.light') },
    { mode: 'dark', icon: 'dark_mode', tip: t('sideNav.dark') },
  ]

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
      <div className="py-2">
        <PanelLink label={t('sideNav.aboutAlive')} onClick={() => onOpenDialog('about')} />
        <PanelLink label={t('sideNav.privacyTerms')} onClick={() => onOpenDialog('privacy')} />
        <PanelLink label={t('sideNav.helpSupport')} onClick={() => onOpenDialog('help')} />
      </div>
      <div className="border-t border-gray-100 dark:border-gray-800" />
      <div className="px-5 py-3">
        <p className="text-xs text-gray-400 mb-2.5">{t('common.settings')}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">{t('settingsGeneral.darkMode')}</span>
          <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-full p-0.5">
            {themeModes.map(({ mode, icon, tip }) => (
              <button
                key={mode}
                onClick={() => setThemeMode(mode)}
                title={tip}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all
                  ${themeMode === mode
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon name={icon} size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PanelLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
    >
      <span>{label}</span>
      <Icon name="chevron_right" size={18} className="text-gray-300 dark:text-gray-600" />
    </button>
  )
}

/* ─────────── Dialog Shell ─────────── */

function DialogShell({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: ReactNode; wide?: boolean
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl ${wide ? 'w-[560px]' : 'w-[480px]'} max-h-[80vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Icon name="close" size={20} className="text-gray-500" />
          </button>
        </div>
        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─────────── About Dialog ─────────── */

function AboutDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()

  return (
    <DialogShell title={t('sideNav.aboutAlive')} onClose={onClose}>
      <div className="px-6 py-8">
        {/* Author + Version */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/silan.png"
            alt="Silan Hu"
            className="w-16 h-16 rounded-full object-cover shadow-md mb-3"
          />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100"><a href="https://github.com/Qingbolan" target="_blank" rel="The Github of Silan Hu">Silan Hu</a></h3>
          <p className="text-sm text-gray-400 mt-0.5">{t('sideNav.creatorTitle')}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed mb-8">
          {t('sideNav.aboutDesc')}
        </p>

        {/* Links */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
          <AboutRow label={t('about.userAgreement')} />
          <AboutRow label={t('about.privacyPolicy')} />
          <AboutRow label={t('about.communityGuidelines')} />
          <AboutRow label={t('about.openSourceLicenses')} last />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          {t('about.copyright', { year: 2026 })}
        </p>
      </div>
    </DialogShell>
  )
}

function AboutRow({ label, last }: { label: string; last?: boolean }) {
  return (
    <button className={`w-full flex items-center justify-between px-4 py-3.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${last ? '' : 'border-b border-gray-100 dark:border-gray-700/50'}`}>
      <span>{label}</span>
      <Icon name="chevron_right" size={18} className="text-gray-300 dark:text-gray-600" />
    </button>
  )
}

/* ─────────── Privacy Dialog ─────────── */

function PrivacyDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()

  return (
    <DialogShell title={t('sideNav.privacyTerms')} onClose={onClose} wide>
      <div className="px-6 py-6 space-y-6">
        <PolicySection title={t('sideNav.privacyPolicyTitle')}>
          <p>{t('sideNav.privacyPolicyContent1')}</p>
          <p>{t('sideNav.privacyPolicyContent2')}</p>
          <p>{t('sideNav.privacyPolicyContent3')}</p>
        </PolicySection>

        <PolicySection title={t('sideNav.termsTitle')}>
          <p>{t('sideNav.termsContent1')}</p>
          <p>{t('sideNav.termsContent2')}</p>
        </PolicySection>

        <PolicySection title={t('sideNav.dataUsageTitle')}>
          <p>{t('sideNav.dataUsageContent1')}</p>
          <p>{t('sideNav.dataUsageContent2')}</p>
        </PolicySection>
      </div>
    </DialogShell>
  )
}

function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {children}
      </div>
    </div>
  )
}

/* ─────────── Help Dialog ─────────── */

function HelpDialog({ onClose }: { onClose: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const { t } = useTranslation()

  const faqItems = t('helpCenter.faqItems', { returnObjects: true }) as { q: string; a: string }[]

  const quickActions = [
    { icon: 'mail', label: t('sideNav.emailUs') },
    { icon: 'feedback', label: t('sideNav.feedbackLabel') },
    { icon: 'bug_report', label: t('sideNav.reportBug') },
  ]

  return (
    <DialogShell title={t('sideNav.helpSupport')} onClose={onClose} wide>
      <div className="px-6 py-6">
        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {quickActions.map((item) => (
            <button
              key={item.icon}
              className="flex flex-col items-center gap-2 py-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name={item.icon} size={20} className="text-primary" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
            </button>
          ))}
        </div>

        {/* FAQ */}
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t('sideNav.faq')}
        </h3>
        <div className="space-y-2">
          {faqItems.map((faq, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left"
              >
                <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 pr-4">
                  {faq.q}
                </span>
                <Icon
                  name="expand_more"
                  size={20}
                  className={`text-gray-400 transition-transform flex-shrink-0 ${expanded === i ? 'rotate-180' : ''}`}
                />
              </button>
              {expanded === i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact footer */}
        <div className="mt-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('sideNav.cantFind')}</p>
          <p className="text-sm text-primary font-medium">support@agent-live.app</p>
        </div>
      </div>
    </DialogShell>
  )
}
