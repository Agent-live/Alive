/**
 * Mock 数据统一导出
 * 集中管理所有模拟数据，方便后续替换为真实 API
 */

// 衣柜数据
export {
  categories,
  statusConfig,
  mainTabs,
  myOutfits,
  myClothes,
  myInspirations,
  myCollections,
  todayOutfit,
} from './closet';
export type {
  Category,
  ClothStatus,
  ClothItem,
  Outfit,
  Inspiration,
  Collection,
  TodayOutfit,
} from './closet';

// 一起页面数据
export {
  togetherTabs,
  activities,
  activityTemplates,
} from './together';
export type {
  ActivityType,
  ActivityUser,
  Activity,
} from './together';

// 洛卡 对话数据
export {
  modeGreetings,
  styleOptions,
  historyConversations,
  sampleDesigns,
  clothingKeywords,
  styleKeywords,
} from './chat';
export type {
  Design,
  Message,
} from './chat';

// 个人中心数据
export {
  profileTabs,
  statusText,
  statusColor,
  myWishes,
  wantedWishes,
  sharedWishes,
  defaultUserAvatar,
  defaultUserProfile,
} from './profile';
export type {
  WishStatus as ProfileWishStatus,
  MyWish,
} from './profile';
