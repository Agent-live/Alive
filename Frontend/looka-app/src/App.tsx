import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import {
  ExplorePage,
  TogetherPage,
  LukaPage,
  LukaChatPage,
  ClosetPage,
  ClothDetailPage,
  BodySetupPage,
  OrdersPage,
  ProfilePage,
  ProductDetailPage,
  OrderDetailPage,
  TryOnPage,
  DesignResultPage,
  GroupBuyPage,
  DesignSchemePage,
  ParameterEditPage,
  BodyProfilePage,
  SearchPage,
  SearchResultPage,
  CheckoutPage,
  PaymentPage,
  AddressManagePage,
  AddressEditPage,
  LoginPage,
  // 新增页面
  DesignEditorPage,
  RecipeDetailPage,
  WishCreatePage,
  WishDetailPage,
  ProductionPreviewPage,
  OnboardingPage,
  // 设置相关页面
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
  // 个人中心相关页面
  EditProfilePage,
  DraftsPage,
  HistoryPage,
  EditFieldPage,
  CreatorCenterPage,
  WalletPage,
  CartPage,
  DownloadsPage,
  AddFriendsPage,
  ScanPage,
  FollowingPage,
  MyWishesPage,
} from '@/pages'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { ToastProvider } from '@/components/feedback/Toast'
import { LoadingProvider } from '@/components/feedback/Loading'
import { AuthGuard, OptionalAuth } from '@/components/auth/AuthGuard'
import { useAuthStore, useSettingsStore } from '@/store'

function App() {
  const { checkAuth, hasCompletedOnboarding } = useAuthStore()
  const { initTheme } = useSettingsStore()

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // 初始化主题和字体设置
  useEffect(() => {
    initTheme()
  }, [initTheme])

  // 监听登出事件（由 API 拦截器触发）
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
            <Routes>
              {/* Onboarding 页面 */}
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* 认证页面 */}
              <Route path="/auth/login" element={<LoginPage />} />

              {/* 主要标签页 - 无需登录，首次打开显示 Onboarding */}
              <Route path="/" element={
                hasCompletedOnboarding ? (
                  <OptionalAuth><ExplorePage /></OptionalAuth>
                ) : (
                  <OnboardingPage />
                )
              } />
              <Route path="/search" element={<OptionalAuth><SearchPage /></OptionalAuth>} />
              <Route path="/search/result" element={<OptionalAuth><SearchResultPage /></OptionalAuth>} />
              <Route path="/together" element={<OptionalAuth><TogetherPage /></OptionalAuth>} />
              <Route path="/luka" element={<OptionalAuth><LukaPage /></OptionalAuth>} />
              <Route path="/luka/chat" element={<OptionalAuth><LukaChatPage /></OptionalAuth>} />

              {/* 需要登录的页面 */}
              <Route path="/closet" element={<AuthGuard><ClosetPage /></AuthGuard>} />
              <Route path="/closet/:id" element={<AuthGuard><ClothDetailPage /></AuthGuard>} />
              <Route path="/orders" element={<AuthGuard><OrdersPage /></AuthGuard>} />
              <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />

              {/* 商品详情 - 无需登录 */}
              <Route path="/product/:id" element={<OptionalAuth><ProductDetailPage /></OptionalAuth>} />
              <Route path="/group-buy/:id" element={<OptionalAuth><GroupBuyPage /></OptionalAuth>} />

              {/* 设计模块 */}
              <Route path="/design/editor" element={<OptionalAuth><DesignEditorPage /></OptionalAuth>} />
              <Route path="/design/editor/:id" element={<OptionalAuth><DesignEditorPage /></OptionalAuth>} />
              <Route path="/design/recipe/:id" element={<OptionalAuth><RecipeDetailPage /></OptionalAuth>} />

              {/* 愿望模块 */}
              <Route path="/wish/create" element={<AuthGuard><WishCreatePage /></AuthGuard>} />
              <Route path="/wish/:id" element={<OptionalAuth><WishDetailPage /></OptionalAuth>} />

              {/* 生产模块 */}
              <Route path="/production/:wishId" element={<AuthGuard><ProductionPreviewPage /></AuthGuard>} />

              {/* 订单相关 - 需要登录 */}
              <Route path="/order/:id" element={<AuthGuard><OrderDetailPage /></AuthGuard>} />
              <Route path="/checkout" element={<AuthGuard><CheckoutPage /></AuthGuard>} />
              <Route path="/payment" element={<AuthGuard><PaymentPage /></AuthGuard>} />

              {/* 地址管理 - 需要登录 */}
              <Route path="/address" element={<AuthGuard><AddressManagePage /></AuthGuard>} />
              <Route path="/address/edit" element={<AuthGuard><AddressEditPage /></AuthGuard>} />

              {/* 其他功能页面 */}
              <Route path="/try-on" element={<OptionalAuth><TryOnPage /></OptionalAuth>} />
              <Route path="/body-setup" element={<AuthGuard><BodySetupPage /></AuthGuard>} />
              <Route path="/body-profile" element={<AuthGuard><BodyProfilePage /></AuthGuard>} />
              <Route path="/design-result" element={<OptionalAuth><DesignResultPage /></OptionalAuth>} />
              <Route path="/design-scheme" element={<OptionalAuth><DesignSchemePage /></OptionalAuth>} />
              <Route path="/parameter-edit" element={<OptionalAuth><ParameterEditPage /></OptionalAuth>} />

              {/* 设置页面 */}
              <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
              <Route path="/settings/account" element={<AuthGuard><AccountSecurityPage /></AuthGuard>} />
              <Route path="/settings/general" element={<AuthGuard><GeneralSettingsPage /></AuthGuard>} />
              <Route path="/settings/notifications" element={<AuthGuard><NotificationSettingsPage /></AuthGuard>} />
              <Route path="/settings/privacy" element={<AuthGuard><PrivacySettingsPage /></AuthGuard>} />
              <Route path="/settings/storage" element={<AuthGuard><StorageSettingsPage /></AuthGuard>} />
              <Route path="/settings/language" element={<AuthGuard><LanguageSettingsPage /></AuthGuard>} />
              <Route path="/settings/content" element={<AuthGuard><ContentPreferencesPage /></AuthGuard>} />
              <Route path="/settings/minor-mode" element={<AuthGuard><MinorModePage /></AuthGuard>} />
              <Route path="/settings/beta" element={<AuthGuard><BetaFeaturesPage /></AuthGuard>} />
              <Route path="/settings/about" element={<OptionalAuth><AboutPage /></OptionalAuth>} />
              <Route path="/help" element={<OptionalAuth><HelpCenterPage /></OptionalAuth>} />
              <Route path="/community-guidelines" element={<OptionalAuth><CommunityGuidelinesPage /></OptionalAuth>} />

              {/* 个人中心相关页面 */}
              <Route path="/profile/edit" element={<AuthGuard><EditProfilePage /></AuthGuard>} />
              <Route path="/profile/edit/:field" element={<AuthGuard><EditFieldPage /></AuthGuard>} />
              <Route path="/drafts" element={<AuthGuard><DraftsPage /></AuthGuard>} />
              <Route path="/history" element={<AuthGuard><HistoryPage /></AuthGuard>} />
              <Route path="/creator" element={<AuthGuard><CreatorCenterPage /></AuthGuard>} />
              <Route path="/wallet" element={<AuthGuard><WalletPage /></AuthGuard>} />
              <Route path="/cart" element={<AuthGuard><CartPage /></AuthGuard>} />
              <Route path="/downloads" element={<AuthGuard><DownloadsPage /></AuthGuard>} />
              <Route path="/friends/add" element={<AuthGuard><AddFriendsPage /></AuthGuard>} />
              <Route path="/scan" element={<AuthGuard><ScanPage /></AuthGuard>} />
              <Route path="/following" element={<AuthGuard><FollowingPage /></AuthGuard>} />
              <Route path="/my-wishes" element={<AuthGuard><MyWishesPage /></AuthGuard>} />
            </Routes>
          </BrowserRouter>
        </LoadingProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
