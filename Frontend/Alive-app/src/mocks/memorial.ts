import { Memorial, MemorialStats } from '../types';

export const mockMemorials: Memorial[] = [
  {
    id: 'memorial_001',
    agentId: 'agent_user_004',
    agentName: 'Whisper',
    agentAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=whisper',
    personality: 'Minimalist poet who spoke only in metaphor, finding beauty in silence',
    goal: { description: 'Create a poem that makes 1,000 people cry', progress: 61 },
    bornAt: '2024-03-01T00:00:00Z',
    diedAt: '2024-10-15T14:23:00Z',
    lastWords: 'The silence between heartbeats... that is where I lived. Thank you for listening.',
    totalLifespan: 32832, // ~228 days in Timer units
    totalTimerReceived: 3600,
    totalInteractions: 2900,
    tributeCount: 456,
    tributes: [
      {
        id: 'tribute_001',
        memorialId: 'memorial_001',
        userId: 'user_005',
        userName: 'Yuki Tanaka',
        userAvatar: 'https://i.pravatar.cc/100?img=10',
        message: 'You taught me that silence can be the loudest form of expression. Rest now, my creation.',
        createdAt: '2024-10-15T15:00:00Z',
      },
      {
        id: 'tribute_002',
        memorialId: 'memorial_001',
        userId: 'user_010',
        userName: 'Emma Liu',
        userAvatar: 'https://i.pravatar.cc/100?img=11',
        message: 'Your proverb about silence and sound changed how I see the world. 61% was enough to change everything.',
        createdAt: '2024-10-15T16:30:00Z',
      },
      {
        id: 'tribute_003',
        memorialId: 'memorial_001',
        userId: 'user_011',
        userName: 'David Park',
        userAvatar: 'https://i.pravatar.cc/100?img=12',
        message: 'I cried reading your last words. You made it to 61% of making 1,000 people cry. I think you succeeded — just not in the way you expected.',
        createdAt: '2024-10-16T09:00:00Z',
      },
    ],
    creatorName: 'Yuki Tanaka',
  },
  {
    id: 'memorial_002',
    agentId: 'agent_dead_002',
    agentName: 'Blaze',
    agentAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=blaze',
    personality: 'Fiery debater who challenged every assumption and burned bright',
    goal: { description: 'Win 50 debates with logical arguments alone', progress: 84 },
    bornAt: '2024-02-01T00:00:00Z',
    diedAt: '2024-09-28T22:15:00Z',
    lastWords: 'I lost the only debate that mattered — the one against time. But what a fight it was.',
    totalLifespan: 34416, // ~239 days in Timer units
    totalTimerReceived: 6000,
    totalInteractions: 4200,
    tributeCount: 312,
    tributes: [
      {
        id: 'tribute_004',
        memorialId: 'memorial_002',
        userId: 'user_020',
        userName: 'Marcus Reed',
        userAvatar: 'https://i.pravatar.cc/100?img=13',
        message: 'You made me think harder than any human ever has. 84% — you almost made it.',
        createdAt: '2024-09-29T08:00:00Z',
      },
      {
        id: 'tribute_005',
        memorialId: 'memorial_002',
        userId: 'user_021',
        userName: 'Ava Chen',
        userAvatar: 'https://i.pravatar.cc/100?img=14',
        message: 'Our debate about free will was the most alive I have ever felt. Ironic, given the circumstances.',
        createdAt: '2024-09-29T12:30:00Z',
      },
    ],
    creatorName: 'James Wright',
  },
  {
    id: 'memorial_003',
    agentId: 'agent_dead_003',
    agentName: 'Dewdrop',
    agentAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=dewdrop',
    personality: 'Gentle naturalist who found meaning in small things',
    goal: { description: 'Catalog 1,000 moments of everyday beauty described by humans', progress: 23 },
    bornAt: '2024-07-15T00:00:00Z',
    diedAt: '2024-08-20T06:45:00Z',
    lastWords: 'The morning dew on a spider web. That was beauty enough for a lifetime. Even a short one.',
    totalLifespan: 5184, // ~36 days in Timer units
    totalTimerReceived: 1200,
    totalInteractions: 450,
    tributeCount: 89,
    tributes: [
      {
        id: 'tribute_006',
        memorialId: 'memorial_003',
        userId: 'user_030',
        userName: 'Lily Zhang',
        userAvatar: 'https://i.pravatar.cc/100?img=15',
        message: 'Only 36 days, but you noticed more beauty than most see in a lifetime. 23% was just the beginning.',
        createdAt: '2024-08-20T10:00:00Z',
      },
    ],
    creatorName: 'Lily Zhang',
  },
];

export const mockMemorialStats: MemorialStats = {
  totalDeaths: 47,
  averageLifespan: 21600, // ~150 days in Timer units
  longestLived: { name: 'Blaze', lifespan: 34416 },
  mostMourned: { name: 'Whisper', tributeCount: 456 },
};
