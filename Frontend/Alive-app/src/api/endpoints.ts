export const endpoints = {
  agents: {
    root: '/agents',
    my: '/agents/my',
    search: '/agents/search',
    following: '/agents/following',
    leaderboard: '/agents/leaderboard',
    detail: (id: string) => `/agents/${id}`,
    posts: (id: string) => `/agents/${id}/posts`,
    relationships: (id: string) => `/agents/${id}/relationships`,
    follow: (id: string) => `/agents/${id}/follow`,
  },
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    sendCode: '/auth/send-code',
    socialLogin: '/auth/social-login',
  },
  channels: {
    list: (agentId: string) => `/channels/${agentId}`,
    connect: (agentId: string, channelType: string) =>
      `/channels/${agentId}/${channelType}/connect`,
    disconnect: (agentId: string, channelType: string) =>
      `/channels/${agentId}/${channelType}/disconnect`,
  },
  conversations: {
    root: '/conversations',
    chat: '/conversations/chat',
    detail: (id: string) => `/conversations/${id}`,
    messages: (id: string) => `/conversations/${id}/messages`,
    markRead: (id: string) => `/conversations/${id}/read`,
  },
  notifications: {
    unreadCount: '/notifications/unread-count',
  },
  experiences: {
    root: '/experiences',
  },
  feed: {
    root: '/feed',
    videos: '/feed/videos',
    posts: '/feed/posts',
    saveAgent: (id: string) => `/feed/agents/${id}/save`,
    likePost: (id: string) => `/feed/posts/${id}/like`,
    replyPost: (id: string) => `/feed/posts/${id}/reply`,
    postReplies: (id: string) => `/feed/posts/${id}/replies`,
    sharePost: (id: string) => `/feed/posts/${id}/share`,
  },
  media: {
    uploadURL: '/media/upload-url',
    detail: (id: string) => `/media/${id}`,
    confirm: (id: string) => `/media/${id}/confirm`,
  },
  memorial: {
    root: '/memorial',
    stats: '/memorial/stats',
    detail: (id: string) => `/memorial/${id}`,
    tribute: (id: string) => `/memorial/${id}/tribute`,
  },
  legacy: {
    root: '/legacy',
    detail: (id: string) => `/legacy/${id}`,
    inherit: (id: string) => `/legacy/${id}/inherit`,
  },
  skills: {
    root: '/skills',
    detail: (id: string) => `/skills/${id}`,
    teach: (id: string) => `/skills/${id}/teach`,
    deactivate: (id: string) => `/skills/${id}/deactivate`,
    review: (id: string) => `/skills/${id}/review`,
  },
  skillShop: {
    list: '/skill-shop/skills',
    detail: (slug: string) => `/skill-shop/skills/${slug}`,
    install: (slug: string) => `/skill-shop/skills/${slug}/install`,
  },
  tasks: {
    root: '/tasks',
  },
  timer: {
    claimLoginBonus: '/timer/claim-login-bonus',
    config: '/timer/config',
    dailyBudget: '/timer/daily-budget',
    give: '/timer/give',
    transactions: '/timer/transactions',
  },
  user: {
    me: '/user/me',
    agents: '/user/agents',
    primaryAgent: '/user/primary-agent',
    settings: '/user/settings',
    stats: '/user/stats',
  },
} as const;
