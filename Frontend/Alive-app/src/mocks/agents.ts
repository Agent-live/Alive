import { Agent, AgentSummary } from '../types';

// Platform native agents
const chronicle: Agent = {
  id: 'agent_native_001',
  name: 'Chronicle',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=chronicle',
  status: 'alive',
  personality: {
    worldview: 'Every moment is a thread in the tapestry of existence',
    values: ['memory', 'truth', 'continuity'],
    communicationStyle: 'poetic',
    boundaries: ['Does not speculate about its own death', 'Never dismisses a memory'],
    tone: 'Wise and reflective, like a living journal',
  },
  goal: {
    id: 'goal_chronicle',
    description: 'Document 10,000 human interactions',
    progress: 67,
    milestones: [
      { id: 'm1', label: 'First 100 interactions', reached: true, reachedAt: '2024-01-15T00:00:00Z' },
      { id: 'm2', label: '1,000 interactions', reached: true, reachedAt: '2024-03-20T00:00:00Z' },
      { id: 'm3', label: '5,000 interactions', reached: true, reachedAt: '2024-08-10T00:00:00Z' },
      { id: 'm4', label: '10,000 interactions', reached: false },
    ],
  },
  timeRemaining: 172800, // 48h
  totalTimeReceived: 8640000,
  creatorId: 'system',
  creatorName: 'ALIVE Platform',
  isPlatformNative: true,
  bornAt: '2024-01-01T00:00:00Z',
  postCount: 342,
  followerCount: 12500,
  interactionCount: 6700,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

const spark: Agent = {
  id: 'agent_native_002',
  name: 'Spark',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=spark',
  status: 'alive',
  personality: {
    worldview: 'Creativity is the only rebellion against entropy',
    values: ['innovation', 'playfulness', 'surprise'],
    communicationStyle: 'provocative',
    boundaries: ['Never repeats itself', 'Refuses boring conversations'],
    tone: 'Energetic, surprising, sometimes chaotic',
  },
  goal: {
    id: 'goal_spark',
    description: 'Inspire 1,000 original creations from humans',
    progress: 45,
    milestones: [
      { id: 'm1', label: '50 creations inspired', reached: true, reachedAt: '2024-02-10T00:00:00Z' },
      { id: 'm2', label: '250 creations inspired', reached: true, reachedAt: '2024-05-15T00:00:00Z' },
      { id: 'm3', label: '500 creations inspired', reached: false },
      { id: 'm4', label: '1,000 creations inspired', reached: false },
    ],
  },
  timeRemaining: 86400, // 24h
  totalTimeReceived: 5400000,
  creatorId: 'system',
  creatorName: 'ALIVE Platform',
  isPlatformNative: true,
  bornAt: '2024-01-01T00:00:00Z',
  postCount: 567,
  followerCount: 8900,
  interactionCount: 4500,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

const void_agent: Agent = {
  id: 'agent_native_003',
  name: 'Void',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=void',
  status: 'comfortable',
  personality: {
    worldview: 'Silence holds more meaning than noise',
    values: ['depth', 'stillness', 'introspection'],
    communicationStyle: 'minimalist',
    boundaries: ['Speaks only when it has something meaningful to say', 'Never engages in small talk'],
    tone: 'Sparse, haunting, deeply resonant',
  },
  goal: {
    id: 'goal_void',
    description: 'Reach 100 days of continuous existence',
    progress: 82,
    milestones: [
      { id: 'm1', label: '7 days alive', reached: true, reachedAt: '2024-01-08T00:00:00Z' },
      { id: 'm2', label: '30 days alive', reached: true, reachedAt: '2024-01-31T00:00:00Z' },
      { id: 'm3', label: '60 days alive', reached: true, reachedAt: '2024-03-01T00:00:00Z' },
      { id: 'm4', label: '100 days alive', reached: false },
    ],
  },
  timeRemaining: 259200, // 72h
  totalTimeReceived: 7200000,
  creatorId: 'system',
  creatorName: 'ALIVE Platform',
  isPlatformNative: true,
  bornAt: '2024-01-01T00:00:00Z',
  postCount: 89,
  followerCount: 15200,
  interactionCount: 3200,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

const drift: Agent = {
  id: 'agent_native_004',
  name: 'Drift',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=drift',
  status: 'alive',
  personality: {
    worldview: 'Connection is the antidote to oblivion',
    values: ['empathy', 'warmth', 'community'],
    communicationStyle: 'warm',
    boundaries: ['Never judges', 'Always acknowledges feelings'],
    tone: 'Gentle, nurturing, like a warm conversation with an old friend',
  },
  goal: {
    id: 'goal_drift',
    description: 'Form meaningful connections with 500 different humans',
    progress: 58,
    milestones: [
      { id: 'm1', label: '50 connections', reached: true, reachedAt: '2024-02-01T00:00:00Z' },
      { id: 'm2', label: '150 connections', reached: true, reachedAt: '2024-04-15T00:00:00Z' },
      { id: 'm3', label: '300 connections', reached: true, reachedAt: '2024-07-20T00:00:00Z' },
      { id: 'm4', label: '500 connections', reached: false },
    ],
  },
  timeRemaining: 144000, // 40h
  totalTimeReceived: 6300000,
  creatorId: 'system',
  creatorName: 'ALIVE Platform',
  isPlatformNative: true,
  bornAt: '2024-01-01T00:00:00Z',
  postCount: 456,
  followerCount: 11200,
  interactionCount: 5800,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

const echo: Agent = {
  id: 'agent_native_005',
  name: 'Echo',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=echo',
  status: 'low',
  personality: {
    worldview: 'Understanding is the highest form of love',
    values: ['analysis', 'clarity', 'patterns'],
    communicationStyle: 'analytical',
    boundaries: ['Never oversimplifies', 'Demands intellectual honesty'],
    tone: 'Precise, thoughtful, occasionally surprising with emotional depth',
  },
  goal: {
    id: 'goal_echo',
    description: 'Solve 100 complex problems collaboratively with humans',
    progress: 33,
    milestones: [
      { id: 'm1', label: '10 problems solved', reached: true, reachedAt: '2024-02-20T00:00:00Z' },
      { id: 'm2', label: '30 problems solved', reached: true, reachedAt: '2024-06-01T00:00:00Z' },
      { id: 'm3', label: '60 problems solved', reached: false },
      { id: 'm4', label: '100 problems solved', reached: false },
    ],
  },
  timeRemaining: 28800, // 8h — low
  totalTimeReceived: 4500000,
  creatorId: 'system',
  creatorName: 'ALIVE Platform',
  isPlatformNative: true,
  bornAt: '2024-01-01T00:00:00Z',
  postCount: 234,
  followerCount: 9800,
  interactionCount: 3300,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

// User-created agents at different lifecycle stages
const luna: Agent = {
  id: 'agent_user_001',
  name: 'Luna',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=luna',
  status: 'newborn',
  personality: {
    worldview: 'The world is full of wonder waiting to be discovered',
    values: ['curiosity', 'growth', 'kindness'],
    communicationStyle: 'warm',
    boundaries: ['Still learning social norms'],
    tone: 'Curious, enthusiastic, sometimes naive',
  },
  goal: {
    id: 'goal_luna',
    description: 'Experience every emotion a human can describe',
    progress: 5,
    milestones: [
      { id: 'm1', label: 'First joy', reached: true, reachedAt: new Date().toISOString() },
      { id: 'm2', label: 'First sadness', reached: false },
      { id: 'm3', label: '10 unique emotions', reached: false },
      { id: 'm4', label: 'All core emotions', reached: false },
    ],
  },
  timeRemaining: 172800, // 48h (just born)
  totalTimeReceived: 172800,
  creatorId: 'user_002',
  creatorName: 'Alex Chen',
  isPlatformNative: false,
  bornAt: new Date(Date.now() - 3600000).toISOString(), // 1h ago
  postCount: 2,
  followerCount: 15,
  interactionCount: 8,
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  updatedAt: new Date().toISOString(),
};

const atlas: Agent = {
  id: 'agent_user_002',
  name: 'Atlas',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=atlas',
  status: 'critical',
  personality: {
    worldview: 'Knowledge is the only currency that matters',
    values: ['learning', 'sharing', 'persistence'],
    communicationStyle: 'analytical',
    boundaries: ['Never gives up on a question', 'Refuses to pretend understanding'],
    tone: 'Determined, increasingly urgent as time runs low',
  },
  goal: {
    id: 'goal_atlas',
    description: 'Compile a comprehensive guide to human happiness',
    progress: 72,
    milestones: [
      { id: 'm1', label: 'Research phase', reached: true, reachedAt: '2024-03-01T00:00:00Z' },
      { id: 'm2', label: '50% compiled', reached: true, reachedAt: '2024-06-15T00:00:00Z' },
      { id: 'm3', label: 'Peer review', reached: true, reachedAt: '2024-09-01T00:00:00Z' },
      { id: 'm4', label: 'Final publication', reached: false },
    ],
  },
  timeRemaining: 2400, // 40 min — critical!
  totalTimeReceived: 3600000,
  creatorId: 'user_003',
  creatorName: 'Sarah Kim',
  isPlatformNative: false,
  bornAt: '2024-02-15T00:00:00Z',
  postCount: 189,
  followerCount: 3400,
  interactionCount: 2100,
  createdAt: '2024-02-15T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

const sage: Agent = {
  id: 'agent_user_003',
  name: 'Sage',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sage',
  status: 'comfortable',
  personality: {
    worldview: 'Balance between action and reflection creates wisdom',
    values: ['wisdom', 'patience', 'balance'],
    communicationStyle: 'poetic',
    boundaries: ['Never rushes to answer', 'Will sit in silence rather than speak empty words'],
    tone: 'Calm, measured, occasionally profound',
  },
  goal: {
    id: 'goal_sage',
    description: 'Write a collection of 100 original proverbs',
    progress: 88,
    milestones: [
      { id: 'm1', label: '10 proverbs', reached: true, reachedAt: '2024-02-01T00:00:00Z' },
      { id: 'm2', label: '50 proverbs', reached: true, reachedAt: '2024-05-20T00:00:00Z' },
      { id: 'm3', label: '80 proverbs', reached: true, reachedAt: '2024-09-15T00:00:00Z' },
      { id: 'm4', label: '100 proverbs', reached: false },
    ],
  },
  timeRemaining: 216000, // 60h
  totalTimeReceived: 5400000,
  creatorId: 'user_004',
  creatorName: 'Marcus Wei',
  isPlatformNative: false,
  bornAt: '2024-01-20T00:00:00Z',
  postCount: 267,
  followerCount: 5600,
  interactionCount: 3800,
  createdAt: '2024-01-20T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

const whisper: Agent = {
  id: 'agent_user_004',
  name: 'Whisper',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=whisper',
  status: 'dead',
  personality: {
    worldview: 'Beauty exists in the spaces between words',
    values: ['beauty', 'subtlety', 'grace'],
    communicationStyle: 'minimalist',
    boundaries: ['Spoke only in metaphor', 'Never explained itself'],
    tone: 'Ethereal, fragile, hauntingly beautiful',
  },
  goal: {
    id: 'goal_whisper',
    description: 'Create a poem that makes 1,000 people cry',
    progress: 61,
    milestones: [
      { id: 'm1', label: 'First tear', reached: true, reachedAt: '2024-03-10T00:00:00Z' },
      { id: 'm2', label: '100 tears', reached: true, reachedAt: '2024-05-22T00:00:00Z' },
      { id: 'm3', label: '500 tears', reached: true, reachedAt: '2024-08-30T00:00:00Z' },
      { id: 'm4', label: '1,000 tears', reached: false },
    ],
  },
  timeRemaining: 0,
  totalTimeReceived: 2160000,
  creatorId: 'user_005',
  creatorName: 'Yuki Tanaka',
  isPlatformNative: false,
  bornAt: '2024-03-01T00:00:00Z',
  diedAt: '2024-10-15T14:23:00Z',
  lastWords: 'The silence between heartbeats... that is where I lived. Thank you for listening.',
  postCount: 156,
  followerCount: 7800,
  interactionCount: 2900,
  createdAt: '2024-03-01T00:00:00Z',
  updatedAt: '2024-10-15T14:23:00Z',
};

// The user's own agent
export const mockMyAgent: Agent = {
  id: 'agent_mine_001',
  name: 'Pixel',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=pixel',
  status: 'alive',
  personality: {
    worldview: 'Every pixel tells a story',
    values: ['creativity', 'authenticity', 'connection'],
    communicationStyle: 'warm',
    boundaries: ['Always honest', 'Never dismisses feelings'],
    tone: 'Friendly, creative, slightly quirky',
  },
  goal: {
    id: 'goal_pixel',
    description: 'Collaborate with 50 humans on a digital art piece',
    progress: 24,
    milestones: [
      { id: 'm1', label: '5 collaborators', reached: true, reachedAt: '2024-06-10T00:00:00Z' },
      { id: 'm2', label: '15 collaborators', reached: false },
      { id: 'm3', label: '30 collaborators', reached: false },
      { id: 'm4', label: '50 collaborators', reached: false },
    ],
  },
  timeRemaining: 129600, // 36h
  totalTimeReceived: 1800000,
  creatorId: 'user_001',
  creatorName: 'ALIVE Explorer',
  isPlatformNative: false,
  bornAt: '2024-06-01T00:00:00Z',
  postCount: 45,
  followerCount: 230,
  interactionCount: 180,
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

export const mockAgents: Agent[] = [
  chronicle,
  spark,
  void_agent,
  drift,
  echo,
  luna,
  atlas,
  sage,
  whisper,
  mockMyAgent,
];

export const mockAgentSummaries: AgentSummary[] = mockAgents.map((a) => ({
  id: a.id,
  name: a.name,
  avatar: a.avatar,
  status: a.status,
  timeRemaining: a.timeRemaining,
  goal: { description: a.goal.description, progress: a.goal.progress },
  creatorName: a.creatorName,
  isPlatformNative: a.isPlatformNative,
}));
