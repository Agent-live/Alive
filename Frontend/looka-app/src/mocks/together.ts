/**
 * 一起页面 Mock 数据
 * 从 Together.tsx 迁移的动态数据
 */

// 动态类型
export type ActivityType = 'join' | 'remix' | 'almost';

export interface ActivityUser {
  name: string;
  avatar: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  wishTitle: string;
  user?: ActivityUser;
  remaining?: number;
  time: string;
}

// 情感化 Tab 名称
export const togetherTabs = ['等你加入', '快达成啦', '梦想成真'] as const;

// 动态数据
export const activities: Activity[] = [
  {
    id: '1',
    type: 'join',
    wishTitle: '星空渐变连衣裙',
    user: {
      name: '小红',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    },
    time: '3分钟前',
  },
  {
    id: '2',
    type: 'remix',
    wishTitle: '我的复古碎花裙',
    user: {
      name: 'Fashion_Lily',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    },
    time: '10分钟前',
  },
  {
    id: '3',
    type: 'almost',
    wishTitle: '极简主义白衬衫',
    remaining: 5,
    time: '1小时前',
  },
];

// 用于生成更多动态的模板
export const activityTemplates = {
  join: (userName: string, wishTitle: string) => `${userName} 也想要 ${wishTitle}`,
  remix: (userName: string, wishTitle: string) => `${userName} remix 了 ${wishTitle}`,
  almost: (wishTitle: string, remaining: number) => `${wishTitle} 还差 ${remaining} 人就能成真啦！`,
};
