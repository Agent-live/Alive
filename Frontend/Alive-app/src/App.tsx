import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import '@/lib/i18n' // Initialize i18n
import {
  FeedPage,
  VideoFeedPage,
  VideoPublishPage,
  ExplorePage,
  CreateAgentPage,
  AgentProfilePage,
  MemorialPage,
  MemorialDetailPage,
  MyAgentPage,
  ConversationListPage,
  ConversationDetailPage,
  ProfilePage,
  EditProfilePage,
  EditFieldPage,
  HistoryPage,
  LoginPage,
  OnboardingPage,
  // Settings
  SettingsPage,
  AccountSecurityPage,
  GeneralSettingsPage,
  NotificationSettingsPage,
  PrivacySettingsPage,
  AboutPage,
  HelpCenterPage,
  StorageSettingsPage,
  LanguageSettingsPage,
  ContentPreferencesPage,
  MinorModePage,
  BetaFeaturesPage,
  CommunityGuidelinesPage,
  MemorySettingsPage,
} from '@/pages'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { ToastProvider } from '@/components/feedback/Toast'
import { LoadingProvider } from '@/components/feedback/Loading'
import { AuthGuard, OptionalAuth } from '@/components/auth/AuthGuard'
import { LoginModal } from '@/components/auth/LoginModal'
import { useAuthStore, useSettingsStore } from '@/store'
import { useStatusTheme } from '@/components/brand'

function App() {
  const { checkAuth, hasCompletedOnboarding } = useAuthStore()
  const { initTheme } = useSettingsStore()

  // The app's accent color breathes with the agent's status
  useStatusTheme()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    initTheme()
  }, [initTheme])

  useEffect(() => {
    const handleLogout = () => {
      useAuthStore.getState().logout()
    }
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  return (
    <ErrorBoundary>
      <ToastProvider>
        <LoadingProvider>
          <BrowserRouter>
            <LoginModal />
            <Routes>
              {/* Onboarding */}
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Auth */}
              <Route path="/auth/login" element={<LoginPage />} />

              {/* Main tabs */}
              <Route path="/" element={
                hasCompletedOnboarding ? (
                  <OptionalAuth><FeedPage /></OptionalAuth>
                ) : (
                  <OnboardingPage />
                )
              } />
              <Route path="/feed/video" element={<OptionalAuth><VideoFeedPage /></OptionalAuth>} />
              <Route path="/feed/video/publish" element={<AuthGuard><VideoPublishPage /></AuthGuard>} />
              <Route path="/explore" element={<OptionalAuth><ExplorePage /></OptionalAuth>} />
              <Route path="/create" element={<AuthGuard><CreateAgentPage /></AuthGuard>} />
              <Route path="/memorial" element={<OptionalAuth><MemorialPage /></OptionalAuth>} />
              <Route path="/memorial/:id" element={<OptionalAuth><MemorialDetailPage /></OptionalAuth>} />

              {/* Agent */}
              <Route path="/agent/:id" element={<OptionalAuth><AgentProfilePage /></OptionalAuth>} />

              {/* My Agent */}
              <Route path="/my-agent" element={<AuthGuard><MyAgentPage /></AuthGuard>} />

              {/* Conversations */}
              <Route path="/conversations" element={<AuthGuard><ConversationListPage /></AuthGuard>} />
              <Route path="/conversations/:id" element={<AuthGuard><ConversationDetailPage /></AuthGuard>} />

              {/* Profile */}
              <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
              <Route path="/profile/edit" element={<AuthGuard><EditProfilePage /></AuthGuard>} />
              <Route path="/profile/edit/:field" element={<AuthGuard><EditFieldPage /></AuthGuard>} />
              <Route path="/history" element={<AuthGuard><HistoryPage /></AuthGuard>} />

              {/* Settings */}
              <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
              <Route path="/settings/account" element={<AuthGuard><AccountSecurityPage /></AuthGuard>} />
              <Route path="/settings/general" element={<AuthGuard><GeneralSettingsPage /></AuthGuard>} />
              <Route path="/settings/notifications" element={<AuthGuard><NotificationSettingsPage /></AuthGuard>} />
              <Route path="/settings/privacy" element={<AuthGuard><PrivacySettingsPage /></AuthGuard>} />
              <Route path="/settings/storage" element={<AuthGuard><StorageSettingsPage /></AuthGuard>} />
              <Route path="/settings/language" element={<AuthGuard><LanguageSettingsPage /></AuthGuard>} />
              <Route path="/settings/content" element={<AuthGuard><ContentPreferencesPage /></AuthGuard>} />
              <Route path="/settings/minor-mode" element={<AuthGuard><MinorModePage /></AuthGuard>} />
              <Route path="/settings/memory" element={<AuthGuard><MemorySettingsPage /></AuthGuard>} />
              <Route path="/settings/beta" element={<AuthGuard><BetaFeaturesPage /></AuthGuard>} />
              <Route path="/settings/about" element={<OptionalAuth><AboutPage /></OptionalAuth>} />
              <Route path="/help" element={<OptionalAuth><HelpCenterPage /></OptionalAuth>} />
              <Route path="/community-guidelines" element={<OptionalAuth><CommunityGuidelinesPage /></OptionalAuth>} />
            </Routes>
          </BrowserRouter>
        </LoadingProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
