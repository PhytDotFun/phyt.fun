import { AppSidebar } from './AppSidebar';
import { HomeTrendingPanel } from '@/features/runners/ui/components/HomeTrendingPanel';
import { Feed } from '@/features/feed/components/ui/Feed';
import { HomeCompetitionsPanel } from '@/features/competitions/ui/components/HomeCompetitionsPanel';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export function Home() {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full group/sidebar-wrapper">
                {/* Hover trigger area for desktop */}
                <div className="hidden md:block fixed left-0 top-0 w-4 h-full z-40 hover:w-8 transition-all duration-300" />

                <AppSidebar />
                <SidebarInset className="flex-1">
                    <div className="flex-1 pt-20">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 h-full">
                            {/* Main Feed - Takes up most space */}
                            <div className="lg:col-span-2 border-r-2 border-border">
                                <Feed />
                            </div>

                            {/* Right Sidebar - Competitions and Trending */}
                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                                <div className="border-r-2 border-border xl:border-r-2">
                                    <HomeCompetitionsPanel />
                                </div>
                                <div>
                                    <HomeTrendingPanel />
                                </div>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
