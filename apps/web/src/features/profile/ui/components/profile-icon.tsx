import { LogOut } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/auth/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCurrentUser } from '@/hooks/users/use-current-user';

interface ProfileIconProps {
    variant?: 'default' | 'reverse' | 'neutral' | 'noShadow';
}

export const ProfileIcon = ({ variant }: ProfileIconProps) => {
    const isMobile = useIsMobile();

    const { data: user, isLoading } = useCurrentUser();

    const effectiveVariant = variant ?? (isMobile ? 'noShadow' : 'noShadow');

    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        await navigate({ to: '/login' });
    };

    // Show skeleton while loading or if there's an error (non-sync errors will still show error boundary)
    if (isLoading || !user) {
        return <Skeleton className="h-9 w-9 rounded-full" />;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={effectiveVariant}
                    className="h-9 w-9 rounded-full p-0 overflow-hidden transition-none transform-none scale-100 focus:scale-100 active:scale-100 hover:scale-100 focus:outline-none focus-visible:ring-0 focus:ring-0 ring-0 focus:transform-none active:transform-none data-[state=open]:transform-none"
                >
                    <Avatar className="h-full w-full">
                        <AvatarImage src={user.profilePictureUrl} />
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="cursor-pointer">
                    {user.username}
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
