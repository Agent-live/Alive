/**
 * 本地存储封装
 */

const STORAGE_PREFIX = 'looka_';

/**
 * 获取带前缀的存储键
 */
function getKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

/**
 * 存储数据
 */
export function setItem<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(getKey(key), serialized);
  } catch (error) {
    console.error('Storage setItem error:', error);
  }
}

/**
 * 获取数据
 */
export function getItem<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(getKey(key));
    if (item === null) {
      return defaultValue ?? null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error('Storage getItem error:', error);
    return defaultValue ?? null;
  }
}

/**
 * 移除数据
 */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(getKey(key));
  } catch (error) {
    console.error('Storage removeItem error:', error);
  }
}

/**
 * 清除所有 LOOKA 相关存储
 */
export function clearAll(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Storage clearAll error:', error);
  }
}

/**
 * 设置带过期时间的数据
 */
export function setItemWithExpiry<T>(
  key: string,
  value: T,
  expiryMs: number
): void {
  const item = {
    value,
    expiry: Date.now() + expiryMs,
  };
  setItem(key, item);
}

/**
 * 获取带过期时间的数据
 */
export function getItemWithExpiry<T>(key: string): T | null {
  const item = getItem<{ value: T; expiry: number }>(key);
  if (!item) {
    return null;
  }
  if (Date.now() > item.expiry) {
    removeItem(key);
    return null;
  }
  return item.value;
}

// 存储键常量
export const STORAGE_KEYS = {
  // 认证相关
  TOKEN: 'token',
  USER: 'user',
  REFRESH_TOKEN: 'refresh_token',

  // 购物车
  CART: 'cart',

  // 用户偏好
  THEME: 'theme',
  LANGUAGE: 'language',
  RECENT_SEARCHES: 'recent_searches',

  // 身材数据
  BODY_MEASUREMENTS: 'body_measurements',

  // 浏览历史
  BROWSE_HISTORY: 'browse_history',

  // 草稿
  ADDRESS_DRAFT: 'address_draft',
  ORDER_DRAFT: 'order_draft',
} as const;

// 用户 Token 管理
export const tokenStorage = {
  get: () => getItem<string>(STORAGE_KEYS.TOKEN),
  set: (token: string) => setItem(STORAGE_KEYS.TOKEN, token),
  remove: () => removeItem(STORAGE_KEYS.TOKEN),
};

// 用户信息管理
export const userStorage = {
  get: () => getItem<unknown>(STORAGE_KEYS.USER),
  set: (user: unknown) => setItem(STORAGE_KEYS.USER, user),
  remove: () => removeItem(STORAGE_KEYS.USER),
};

// 主题管理
export const themeStorage = {
  get: () => getItem<'light' | 'dark' | 'system'>(STORAGE_KEYS.THEME, 'system'),
  set: (theme: 'light' | 'dark' | 'system') => setItem(STORAGE_KEYS.THEME, theme),
};

// 搜索历史管理
export const searchHistoryStorage = {
  get: () => getItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES, []) || [],
  add: (keyword: string) => {
    const history = searchHistoryStorage.get();
    const filtered = history.filter((k) => k !== keyword);
    const updated = [keyword, ...filtered].slice(0, 10);
    setItem(STORAGE_KEYS.RECENT_SEARCHES, updated);
  },
  remove: (keyword: string) => {
    const history = searchHistoryStorage.get();
    const updated = history.filter((k) => k !== keyword);
    setItem(STORAGE_KEYS.RECENT_SEARCHES, updated);
  },
  clear: () => removeItem(STORAGE_KEYS.RECENT_SEARCHES),
};
