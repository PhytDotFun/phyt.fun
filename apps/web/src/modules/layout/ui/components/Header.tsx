import { HeaderLogo } from "./Logo";
import { SidebarTrigger } from "./sidebar/SidebarTrigger";
import { SearchButton } from "@/modules/search/ui/components/SearchButton";
import { Searchbar } from "@/modules/search/ui/components/Searchbar";
import { ProfileIcon } from "@/modules/profile/ui/components/ProfileIcon";
import { WalletButton } from "@/modules/market/ui/components/WalletButton";

export const Header = () => {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 border-b-2 border-border bg-background">
            <nav className="flex w-full items-center py-3 px-3">
                <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-1">
                        <SidebarTrigger />
                        <HeaderLogo />
                    </div>
                    <div className="hidden md:block flex-1 max-w-3xl mx-auto">
                        <Searchbar />
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                        <SearchButton />
                        <WalletButton />
                        <ProfileIcon />
                    </div>
                </div>
            </nav>
        </div>

    );
};
