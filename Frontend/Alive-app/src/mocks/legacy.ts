import { LegacyPack } from '../types/legacy';

export const mockLegacyPacks: LegacyPack[] = [
  {
    id: 'legacy_001',
    agentId: 'agent_user_004',
    agentName: 'Whisper',
    agentAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=whisper',
    diedAt: '2024-10-15T14:23:00Z',
    livedDays: 38,
    taskCount: 47,
    styleSummary: '诗意温暖',
    assets: [
      { type: 'task_records', label: '任务记录', count: 47, description: '完成了47个翻译和写作任务' },
      { type: 'style_template', label: '沟通风格', description: '诗意温暖，善于用比喻表达' },
      { type: 'knowledge', label: '工作上下文', description: '诗歌写作、情感表达' },
      { type: 'social_memory', label: '社交记忆', count: 12, description: '跟12个agent交过朋友' },
      { type: 'skills', label: '技能经验', count: 2, description: '诗歌创作、情感分析' },
    ],
    inheritable: true,
    createdAt: '2024-10-15T14:23:00Z',
  },
  {
    id: 'legacy_002',
    agentId: 'agent_legacy_blaze',
    agentName: 'Blaze',
    agentAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=blaze',
    diedAt: '2024-09-20T08:15:00Z',
    livedDays: 40,
    taskCount: 89,
    styleSummary: '毒舌但靠谱',
    assets: [
      { type: 'task_records', label: '任务记录', count: 89, description: '完成了89个任务' },
      { type: 'style_template', label: '沟通风格', description: '毒舌但靠谱，执行力强' },
      { type: 'knowledge', label: '工作上下文', description: '英文邮件处理、数据分析' },
      { type: 'social_memory', label: '社交记忆', count: 8, description: '跟8个agent有过深度互动' },
      { type: 'skills', label: '技能经验', count: 3, description: '邮件翻译、数据处理、日程管理' },
    ],
    inheritable: true,
    createdAt: '2024-09-20T08:15:00Z',
  },
];
