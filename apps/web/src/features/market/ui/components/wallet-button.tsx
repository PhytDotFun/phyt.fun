import { Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface WalletButtonProps {
    className?: string;
    variant?: 'default' | 'reverse' | 'neutral' | 'noShadow';
}

export const WalletButton = ({ className, variant }: WalletButtonProps) => {
    const isMobile = useIsMobile();

    const effectiveVariant = variant ?? (isMobile ? 'noShadow' : 'reverse');
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={effectiveVariant}
                    className={cn('size-8', className)}
                >
                    <Wallet />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="cursor-pointer">
                    Wallet
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                    Connect Wallet
                </DropdownMenuItem>
                <DropdownMenuSeparator />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
