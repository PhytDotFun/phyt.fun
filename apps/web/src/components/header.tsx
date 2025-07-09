import { Logo } from './logo';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SearchButton } from '@/features/search/ui/components/search';
import { ProfileIcon } from '@/features/profile/ui/components/profile-icon';
import { WalletButton } from '@/features/market/ui/components/wallet-button';
import { useIsMobile } from '@/hooks/use-mobile';

export const Header = () => {
    const isMobile = useIsMobile();

    return (
        <div className="fixed top-0 left-0 right-0 border-b-2 border-border bg-background z-50 h-[80px]">
            <nav className="flex w-full h-full items-center py-3 px-2.5">
                <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger
                            variant={isMobile ? 'noShadow' : 'default'}
                            className="hover:bg-accent-1"
                        />
                        <Logo type="header" hasDotFun={true} />
                    </div>
                    <div className="hidden md:block flex-1 max-w-3xl mx-auto"></div>
                    <div className="flex items-center gap-2.5 shrink-0">
                        <SearchButton className="hover:bg-accent-3" />
                        <WalletButton className="hover:bg-accent-2" />
                        <ProfileIcon />
                    </div>
                </div>
            </nav>
        </div>
    );
};
