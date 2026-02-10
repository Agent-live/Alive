// 面料信息
export interface FabricInfo {
  id: string;
  name: string;
  composition: string[];
  origin: string;
  texture: string;
  images: string[];
  features?: string[];
  careInstructions?: string[];
}

// 生产阶段
export interface ProductionStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  estimatedDays: number;
  actualDays?: number;
  startedAt?: string;
  completedAt?: string;
}

// 设计视图
export interface DesignView {
  type: 'front' | 'back' | 'detail' | 'side';
  image: string;
  label?: string;
}

// 规格项
export interface SpecificationItem {
  label: string;
  value: string;
  unit?: string;
}

// 生产预览
export interface ProductionPreview {
  designSheets: DesignView[];
  fabric: FabricInfo;
  specifications: SpecificationItem[];
  stages: ProductionStage[];
  estimatedDelivery: string;
  moq: number;
  currentCount: number;
  qualityGrade?: string;
  craftDetails?: CraftDetail[];
}

// 工艺详情
export interface CraftDetail {
  name: string;
  description: string;
  icon?: string;
}

// 生产进度
export interface ProductionProgress {
  wishId: string;
  currentStage: number;
  totalStages: number;
  stages: ProductionStage[];
  estimatedCompletion: string;
  updates: ProductionUpdate[];
}

// 生产更新
export interface ProductionUpdate {
  id: string;
  type: 'status_change' | 'photo' | 'note';
  content: string;
  image?: string;
  createdAt: string;
}
