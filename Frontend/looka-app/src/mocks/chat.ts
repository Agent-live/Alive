/**
 * 洛卡 对话 Mock 数据
 * 从 LukaChat.tsx 迁移的历史对话数据
 */

export interface Design {
  id: string;
  image: string;
}

export interface Message {
  id: string;
  from: 'luka' | 'user';
  content: string;
  image?: string;
  options?: string[];
  isGenerating?: boolean;
  designs?: Design[];
}

// 模式问候语
export const modeGreetings: Record<string, string> = {
  describe: '好的，告诉我你想要什么样的衣服？',
  inspiration: '发张图给我看看，我来帮你做类似的~',
  remix: '选一件衣柜里的衣服，告诉我你想怎么改~',
  default: '想做什么样的衣服呢？',
};

// 风格选项
export const styleOptions = ['仙女飘逸', '日常简约', '复古优雅', '甜酷混搭'] as const;

// 模拟历史对话数据
export const historyConversations: Record<string, Message[]> = {
  '1': [
    { id: '1', from: 'luka', content: '想做什么样的衣服呢？' },
    { id: '2', from: 'user', content: '我想要一条像星空一样的裙子，有渐变的感觉' },
    { id: '3', from: 'luka', content: '想要什么风格的呢？', options: [...styleOptions] },
    { id: '4', from: 'user', content: '仙女飘逸' },
    {
      id: '5',
      from: 'luka',
      content: '给你生成了几个方向，点击看大图~',
      designs: [
        { id: '1', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400' },
        { id: '2', image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400' },
        { id: '3', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400' },
      ],
    },
  ],
  '2': [
    { id: '1', from: 'luka', content: '想做什么样的衣服呢？' },
    { id: '2', from: 'user', content: '帮我做一件复古和服外套' },
    {
      id: '3',
      from: 'luka',
      content: '好的～给你生成了几个方案',
      designs: [
        { id: '4', image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400' },
        { id: '5', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400' },
      ],
    },
    { id: '4', from: 'user', content: '第一个不错，我要这个' },
    { id: '5', from: 'luka', content: '太好了！已经帮你发起愿望啦，等更多人一起就可以开始制作了～ 🎉' },
  ],
};

// 示例设计图
export const sampleDesigns: Design[] = [
  { id: '1', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400' },
  { id: '2', image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400' },
  { id: '3', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400' },
];

// 关键词匹配
export const clothingKeywords = ['裙', '衣', '裤', '外套', '衬衫', 'T恤', '连衣裙'];
export const styleKeywords = ['简约', '复古', '甜美', '酷', '优雅', '仙', '日常', '街头'];
