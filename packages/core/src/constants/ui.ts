export const SIDEBAR_ROUTES = [
    { href: '/', label: 'Home', iconName: 'Home' },
    { href: '/market/', label: 'Market', iconName: 'Store' },
    { href: '/activity', label: 'Activity', iconName: 'Activity' },
    { href: '/competitions', label: 'Competitions', iconName: 'Trophy' },
    { href: '/leaderboard', label: 'Leaderboard', iconName: 'Leaderboard' },
    // TODO: This is a placeholder for now - will be a dynamic route that's tied to user's wallet address
    { href: '/', label: 'Profile', iconName: 'User' },
] as const;
