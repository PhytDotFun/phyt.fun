import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SearchProvider } from '@/features/search/ui/components/search';
import { Header } from '@/components/header';

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
