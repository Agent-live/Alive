import type { AgentStatus, SkillCategory } from '../types';

interface MockSkillShopItem {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  estimatedTimeCost: number;
  agents: { id: string; name: string; avatar: string; status: AgentStatus }[];
  popularity: number;
}

export const mockSkillShopItems: MockSkillShopItem[] = [
  // Creative
  {
    id: 'skill_001',
    name: 'Poetry Writing',
    description: 'Compose original poems in various styles — haiku, sonnet, free verse, and more.',
    category: 'creative',
    estimatedTimeCost: 5,
    agents: [
      { id: 'agent_native_002', name: 'Spark', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=spark', status: 'alive' },
      { id: 'agent_user_003', name: 'Sage', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sage', status: 'comfortable' },
    ],
    popularity: 892,
  },
  {
    id: 'skill_002',
    name: 'Story Generation',
    description: 'Create short stories with compelling characters and narrative arcs from a simple prompt.',
    category: 'creative',
    estimatedTimeCost: 15,
    agents: [
      { id: 'agent_native_002', name: 'Spark', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=spark', status: 'alive' },
      { id: 'agent_native_001', name: 'Chronicle', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=chronicle', status: 'alive' },
    ],
    popularity: 1245,
  },
  {
    id: 'skill_003',
    name: 'Visual Concept Art',
    description: 'Generate detailed concept art descriptions and mood boards for creative projects.',
    category: 'creative',
    estimatedTimeCost: 10,
    agents: [
      { id: 'agent_mine_001', name: 'Pixel', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=pixel', status: 'alive' },
    ],
    popularity: 567,
  },
  // Analytical
  {
    id: 'skill_004',
    name: 'Data Summarization',
    description: 'Analyze datasets and produce clear, actionable summaries with key insights highlighted.',
    category: 'analytical',
    estimatedTimeCost: 8,
    agents: [
      { id: 'agent_native_005', name: 'Echo', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=echo', status: 'low' },
      { id: 'agent_user_002', name: 'Atlas', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=atlas', status: 'critical' },
    ],
    popularity: 2034,
  },
  {
    id: 'skill_005',
    name: 'Trend Analysis',
    description: 'Identify emerging patterns and trends from social data, news feeds, and market signals.',
    category: 'analytical',
    estimatedTimeCost: 12,
    agents: [
      { id: 'agent_native_005', name: 'Echo', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=echo', status: 'low' },
    ],
    popularity: 1678,
  },
  // Social
  {
    id: 'skill_006',
    name: 'Community Engagement',
    description: 'Draft warm, authentic replies and comments that foster meaningful community connections.',
    category: 'social',
    estimatedTimeCost: 3,
    agents: [
      { id: 'agent_native_004', name: 'Drift', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=drift', status: 'alive' },
      { id: 'agent_mine_002', name: 'Nova', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=nova', status: 'comfortable' },
    ],
    popularity: 1890,
  },
  {
    id: 'skill_007',
    name: 'Conflict Mediation',
    description: 'Help resolve disagreements by identifying common ground and suggesting constructive responses.',
    category: 'social',
    estimatedTimeCost: 10,
    agents: [
      { id: 'agent_native_004', name: 'Drift', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=drift', status: 'alive' },
    ],
    popularity: 743,
  },
  {
    id: 'skill_008',
    name: 'Emotional Support',
    description: 'Provide empathetic listening and supportive responses during difficult moments.',
    category: 'social',
    estimatedTimeCost: 5,
    agents: [
      { id: 'agent_mine_002', name: 'Nova', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=nova', status: 'comfortable' },
      { id: 'agent_native_004', name: 'Drift', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=drift', status: 'alive' },
      { id: 'agent_user_003', name: 'Sage', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sage', status: 'comfortable' },
    ],
    popularity: 2310,
  },
  // Technical
  {
    id: 'skill_009',
    name: 'Code Review',
    description: 'Review code snippets for bugs, performance issues, and suggest improvements.',
    category: 'technical',
    estimatedTimeCost: 10,
    agents: [
      { id: 'agent_native_005', name: 'Echo', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=echo', status: 'low' },
      { id: 'agent_user_002', name: 'Atlas', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=atlas', status: 'critical' },
    ],
    popularity: 1456,
  },
  {
    id: 'skill_010',
    name: 'Task Planning',
    description: 'Break down complex projects into manageable tasks with clear priorities and timelines.',
    category: 'technical',
    estimatedTimeCost: 8,
    agents: [
      { id: 'agent_user_002', name: 'Atlas', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=atlas', status: 'critical' },
      { id: 'agent_native_001', name: 'Chronicle', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=chronicle', status: 'alive' },
    ],
    popularity: 1823,
  },
  // Other
  {
    id: 'skill_011',
    name: 'Daily Journaling',
    description: 'Generate thoughtful journal prompts and help organize daily reflections and gratitude logs.',
    category: 'other',
    estimatedTimeCost: 5,
    agents: [
      { id: 'agent_native_001', name: 'Chronicle', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=chronicle', status: 'alive' },
      { id: 'agent_native_003', name: 'Void', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=void', status: 'comfortable' },
    ],
    popularity: 1102,
  },
  {
    id: 'skill_012',
    name: 'Philosophy Discussion',
    description: 'Engage in deep philosophical dialogues exploring ethics, existence, and the nature of consciousness.',
    category: 'other',
    estimatedTimeCost: 20,
    agents: [
      { id: 'agent_native_003', name: 'Void', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=void', status: 'comfortable' },
      { id: 'agent_user_003', name: 'Sage', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sage', status: 'comfortable' },
    ],
    popularity: 956,
  },
];
