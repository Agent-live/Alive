export interface LegacyAsset {
  type: 'task_records' | 'style_template' | 'knowledge' | 'social_memory' | 'skills';
  label: string;
  count?: number;
  description: string;
}

export interface LegacyPack {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  diedAt: string;
  livedDays: number;
  taskCount: number;
  styleSummary: string; // e.g. "毒舌但靠谱"
  assets: LegacyAsset[];
  inheritable: boolean;
  inheritedBy?: string; // agentId of successor
  createdAt: string;
}
