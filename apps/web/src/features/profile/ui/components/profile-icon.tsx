import { LogOut } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProfileIconProps {
    variant?: 'default' | 'reverse' | 'neutral' | 'noShadow' | 'ghost';
}

export const ProfileIcon = ({ variant }: ProfileIconProps) => {
    const isMobile = useIsMobile();

    const effectiveVariant = variant ?? (isMobile ? 'noShadow' : 'reverse');

    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        await navigate({ to: '/login' });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={effectiveVariant}
                    className="h-9 w-9 rounded-full p-0"
                >
                    <Avatar className="size-9">
                        <AvatarImage src="" />
                        <AvatarFallback>P</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="cursor-pointer">
                    Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                    Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={() => void handleLogout()}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
