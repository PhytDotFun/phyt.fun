import { Header } from '../Header';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SearchProvider } from '@/features/search/ui/components/Search';

interface AuthenticatedLayoutProps {
    children: React.ReactNode;
}

export const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
    return (
        <SidebarProvider>
            <SearchProvider>
                <Header />
                <AppSidebar />
                <main>{children}</main>
            </SearchProvider>
        </SidebarProvider>
    );
};
