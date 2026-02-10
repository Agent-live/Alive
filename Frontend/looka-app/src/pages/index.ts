// 发现模块
export { ExplorePage, SearchPage, SearchResultPage } from './explore'

// 愿望模块
export { TogetherPage, GroupBuyPage, WishCreatePage, WishDetailPage } from './wish'

// 设计模块
export { DesignEditorPage, RecipeDetailPage } from './design'

// 生产模块
export { ProductionPreviewPage } from './production'

// 洛卡 AI 模块
export { LukaPage, LukaChatPage, DesignResultPage, DesignSchemePage, TryOnPage } from './luka'

// 衣柜模块
export { ClosetPage, ClothDetailPage } from './closet'

// 个人中心模块
export {
  ProfilePage,
  BodyProfilePage,
  BodySetupPage,
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
} from './profile'
export { default as AddressManagePage } from './profile/AddressManage'
export { default as AddressEditPage } from './profile/AddressEdit'

// 设置模块
export {
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
} from './settings'

// 订单模块
export { OrdersPage, OrderDetailPage, ProductDetailPage, ParameterEditPage } from './order'
export { default as CheckoutPage } from './order/Checkout'
export { default as PaymentPage } from './order/Payment'

// 认证模块
export { default as LoginPage } from './auth/Login'

// Onboarding 模块
export { OnboardingPage } from './onboarding'
