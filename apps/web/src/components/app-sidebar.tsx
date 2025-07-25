import { Activity, BarChart3, Home, Store, Trophy, User } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { cn } from '@/lib/utils';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar
} from '@/components/ui/sidebar';

const menuItems = [
    {
        title: 'HOME',
        url: '/',
        icon: Home
    },
    {
        title: 'ACTIVITY',
        url: '/activity',
        icon: Activity
    },
    {
        title: 'COMPETITIONS',
        url: '/competitions',
        icon: Trophy
    },
    {
        title: 'LEADERBOARD',
        url: '/leaderboard',
        icon: BarChart3
    },
    {
        title: 'MARKET',
        url: '/market',
        icon: Store
    },
    {
        title: 'PROFILE',
        url: '/profile',
        icon: User
    }
];

export function AppSidebar() {
    const { state } = useSidebar();
    return (
        <Sidebar
            collapsible="icon"
            className="top-[80px] bg-background transition-all duration-200 ease-in-out z-50"
        >
            <SidebarContent>
                <SidebarGroup className={cn(state !== 'collapsed' && 'p-0')}>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        size="xl"
                                        className="w-full rounded-none border-main p-4"
                                    >
                                        <Link
                                            to={item.url}
                                            className="font-bold"
                                        >
                                            <item.icon className="size-5" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
