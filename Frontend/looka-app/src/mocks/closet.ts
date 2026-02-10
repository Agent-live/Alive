/**
 * 衣柜模块 Mock 数据
 * 从 Closet.tsx 迁移的所有硬编码数据
 */

// 衣服分类
export const categories = ['全部', '上装', '下装', '裙装', '外套', '配饰'] as const;

export type Category = (typeof categories)[number];

// 衣服状态类型
export type ClothStatus = 'making' | 'shipping' | 'owned';

// 单件衣服类型
export interface ClothItem {
  id: string;
  modelImage: string;
  clothImage: string;
  name: string;
  category: Category;
  status: ClothStatus;
}

// 穿搭类型
export interface Outfit {
  id: string;
  name: string;
  items: string[];
  occasion: string;
}

// 灵感记录类型
export interface Inspiration {
  id: string;
  text: string;
  image: string | null;
  tags: string[];
  time: string;
  status: 'new' | 'realized';
}

// 收藏类型
export interface Collection {
  id: string;
  modelImage: string;
  clothImage: string;
  name: string;
  from: string;
}

// 今日推荐类型
export interface TodayOutfit {
  greeting: string;
  items: { id: string; image: string; name: string }[];
}

// 状态配置
export const statusConfig: Record<ClothStatus, { text: string; color: string }> = {
  making: { text: '制作中', color: 'bg-amber-500' },
  shipping: { text: '快递中', color: 'bg-sky-500' },
  owned: { text: '', color: '' },
};

// 主 Tab
export const mainTabs = ['穿搭', '衣帽间', '灵感', '心愿单'] as const;

// 我的穿搭
export const myOutfits: Outfit[] = [
  {
    id: 'outfit-1',
    name: '通勤优雅',
    items: [
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
    ],
    occasion: '上班',
  },
  {
    id: 'outfit-2',
    name: '周末休闲',
    items: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
      'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
    ],
    occasion: '约会',
  },
];

// 我的衣服（衣帽间）
export const myClothes: ClothItem[] = [
  {
    id: '1',
    modelImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400',
    clothImage: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200',
    name: '星空渐变长裙',
    category: '裙装',
    status: 'making',
  },
  {
    id: '2',
    modelImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    clothImage: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200',
    name: '真丝和服外套',
    category: '外套',
    status: 'shipping',
  },
  {
    id: '3',
    modelImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
    clothImage: 'https://images.unsplash.com/photo-1485968579169-a6b12a6e05ff?w=200',
    name: '极简白衬衫',
    category: '上装',
    status: 'owned',
  },
  {
    id: '5',
    modelImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
    clothImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200',
    name: '复古格纹西装',
    category: '外套',
    status: 'owned',
  },
];

// 灵感（记录想法）
export const myInspirations: Inspiration[] = [
  {
    id: 'i1',
    text: '想要一条能在海边穿的飘逸长裙，最好是白色或浅蓝色',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300',
    tags: ['度假', '飘逸', '长裙'],
    time: '3天前',
    status: 'new',
  },
  {
    id: 'i2',
    text: '看到一个博主穿的针织开衫很好看，想要类似的，但要更修身一点',
    image: null,
    tags: ['针织', '开衫', '修身'],
    time: '1周前',
    status: 'new',
  },
  {
    id: 'i3',
    text: '需要一件能配所有裤子的基础款白T，领口不要太大',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300',
    tags: ['基础款', '白T', '百搭'],
    time: '2周前',
    status: 'realized',
  },
];

// 收藏
export const myCollections: Collection[] = [
  {
    id: 'c1',
    modelImage: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400',
    clothImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200',
    name: '海边度假白裙',
    from: '小红书',
  },
  {
    id: 'c2',
    modelImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    clothImage: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=200',
    name: '街头风牛仔外套',
    from: '街拍',
  },
  {
    id: 'c3',
    modelImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400',
    clothImage: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=200',
    name: '气质渐变长裙',
    from: '淘宝',
  },
  {
    id: 'c4',
    modelImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
    clothImage: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200',
    name: '英伦复古西装',
    from: 'B站',
  },
  {
    id: 'c5',
    modelImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
    clothImage: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=200',
    name: '极简白衬衫',
    from: '微信',
  },
];

// 今日推荐搭配
export const todayOutfit: TodayOutfit = {
  greeting: '今天有点冷，推荐这样穿',
  items: [
    { id: '5', image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400', name: '复古格纹西装' },
    { id: '3', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400', name: '极简白衬衫' },
  ],
};
