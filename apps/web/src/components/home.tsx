// import { HomeTrendingPanel } from '@/features/runners/ui/components/HomeTrendingPanel';
import { Feed } from '@/features/feed/ui/components/feed';
// import { HomeCompetitionsPanel } from '@/features/competitions/ui/components/HomeCompetitionsPanel';

export function Home() {
    return (
        <div className="flex min-h-screen w-full">
            <div className="flex-1 pt-20">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 h-full">
                    <div className="lg:col-span-2 border-r-2 border-border">
                        <Feed />
                    </div>

                    {/* <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                                <div className="border-r-2 border-border xl:border-r-2">
                                    <HomeCompetitionsPanel />
                                </div>
                                <div>
                                    <HomeTrendingPanel />
                                </div>
                            </div> */}
                </div>
            </div>
        </div>
    );
}
