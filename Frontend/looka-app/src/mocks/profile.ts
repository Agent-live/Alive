/**
 * 个人中心 Mock 数据
 * 从 Profile.tsx 迁移的硬编码数据
 */

// 愿望状态类型
export type WishStatus = 'collecting' | 'making' | 'done';

// 我的愿望类型
export interface MyWish {
  id: string;
  modelImage: string;
  clothImage: string;
  name: string;
  status: WishStatus;
  wantCount: number;
}

// Profile Tab 名称
export const profileTabs = ['我许的愿', '想要的', '分享'] as const;

// 状态文本映射
export const statusText: Record<WishStatus, string> = {
  collecting: '等人一起',
  making: '制作中',
  done: '已实现',
};

// 状态颜色映射
export const statusColor: Record<WishStatus, string> = {
  collecting: 'bg-primary/10 text-primary dark:bg-primary/20',
  making: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  done: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

// 我许的愿望
export const myWishes: MyWish[] = [
  {
    id: '1',
    modelImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400',
    clothImage: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200',
    name: '星空渐变长裙',
    status: 'making',
    wantCount: 23,
  },
  {
    id: '2',
    modelImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    clothImage: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200',
    name: '复古格纹西装',
    status: 'collecting',
    wantCount: 18,
  },
  {
    id: '3',
    modelImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
    clothImage: 'https://images.unsplash.com/photo-1485968579169-a6b12a6e05ff?w=200',
    name: '极简白衬衫',
    status: 'done',
    wantCount: 45,
  },
];

// 想要的（收藏的别人的愿望）
export const wantedWishes: MyWish[] = [
  {
    id: 'w1',
    modelImage: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400',
    clothImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200',
    name: '法式复古连衣裙',
    status: 'collecting',
    wantCount: 156,
  },
  {
    id: 'w2',
    modelImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
    clothImage: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=200',
    name: '慵懒风针织开衫',
    status: 'making',
    wantCount: 89,
  },
  {
    id: 'w3',
    modelImage: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
    clothImage: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200',
    name: '简约廓形西装',
    status: 'collecting',
    wantCount: 234,
  },
  {
    id: 'w4',
    modelImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
    clothImage: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200',
    name: '印花丝绸衬衫',
    status: 'done',
    wantCount: 67,
  },
];

// 分享的（自己分享出去的内容）
export const sharedWishes: MyWish[] = [
  {
    id: 's1',
    modelImage: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400',
    clothImage: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200',
    name: '度假风印花长裙',
    status: 'done',
    wantCount: 312,
  },
  {
    id: 's2',
    modelImage: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400',
    clothImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200',
    name: '极简主义白T',
    status: 'done',
    wantCount: 198,
  },
];

// 默认头像
export const defaultUserAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';

// 默认用户信息
export const defaultUserProfile = {
  name: 'Ava',
  bio: '用 洛卡 实现我所有的穿搭梦想 ✨',
  avatar: defaultUserAvatar,
  stats: {
    wishes: 3,
    wants: 8,
    shares: 5,
  },
};
