import { UserSummary } from './user';

// 设计状态
export type DesignStatus = 'draft' | 'wishing' | 'making' | 'shipping' | 'owned';

// 设计配方
export interface DesignRecipe {
  id: string;
  prompt: string;
  parameters: DesignParameters;
  references: ReferenceImage[];
  createdAt: string;
}

// 设计参数
export interface DesignParameters {
  style: string;
  fabric: string;
  scenario: string;
  budget: { min: number; max: number };
  fit: string;
  intensity: number;
}

// 参考图
export interface ReferenceImage {
  id: string;
  url: string;
  source?: string;
  type: 'inspiration' | 'style' | 'detail';
}

// 设计版本
export interface DesignVersion {
  id: string;
  designId: string;
  recipe: DesignRecipe;
  images: string[];
  createdAt: string;
  parentVersionId?: string;
}

// 完整设计
export interface Design {
  id: string;
  name: string;
  description?: string;
  status: DesignStatus;
  currentVersion: DesignVersion;
  versions: DesignVersion[];
  creator: UserSummary;
  stats: DesignStats;
  createdAt: string;
  updatedAt: string;
}

// 设计统计
export interface DesignStats {
  views: number;
  likes: number;
  remixes: number;
  shares: number;
}

// 设计卡片（列表展示用）
export interface DesignCard {
  id: string;
  name: string;
  image: string;
  status: DesignStatus;
  creator: UserSummary;
  stats: DesignStats;
  createdAt: string;
}

// 创建设计请求
export interface CreateDesignRequest {
  name: string;
  prompt: string;
  parameters: DesignParameters;
  references?: ReferenceImage[];
}

// 更新设计请求
export interface UpdateDesignRequest {
  name?: string;
  description?: string;
  parameters?: Partial<DesignParameters>;
}

// Remix 设计请求
export interface RemixDesignRequest {
  sourceDesignId: string;
  modifications?: Partial<DesignParameters>;
}
