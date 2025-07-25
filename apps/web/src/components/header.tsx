import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    Searchbar,
    SearchButton
} from '@/features/search/ui/components/search';
import { ProfileIcon } from '@/features/profile/ui/components/profile-icon';
import { WalletButton } from '@/features/market/ui/components/wallet-button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/logo';

export const Header = () => {
    const isMobile = useIsMobile();

    return (
        <div className="fixed top-0 left-0 right-0 border-b-2 border-border bg-background z-50 h-[80px]">
            <nav className="flex w-full h-full items-center py-3 px-[8.5px]">
                <SidebarTrigger
                    variant={isMobile ? 'noShadow' : 'reverse'}
                    className="hover:bg-sidebar hover:text-sidebar-foreground"
                />
                <div className="flex items-center justify-between w-full px-4">
                    <div className="flex items-center gap-3">
                        <Logo type="header" hasDotFun={true} />
                    </div>
                    <Searchbar />
                    <div className="flex items-center gap-3 shrink-0">
                        <SearchButton className="hover:bg-accent-3" />
                        <WalletButton className="hover:bg-accent-2" />
                        <ProfileIcon />
                    </div>
                </div>
            </nav>
        </div>
    );
};
