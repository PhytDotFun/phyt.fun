import { Activity, BarChart3, Home, Store, Trophy, User } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
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
    return (
        <Sidebar
            className="hidden md:block group-hover/sidebar-wrapper:translate-x-0 -translate-x-full transition-transform duration-300 ease-in-out hover:translate-x-0"
            collapsible="offcanvas"
        >
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-foreground font-mono text-lg font-bold">
                        NAVIGATION
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            to={item.url}
                                            className="font-mono font-bold"
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
