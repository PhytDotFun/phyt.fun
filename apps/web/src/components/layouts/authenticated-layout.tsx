import { Header } from '../header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SearchProvider } from '@/features/search/ui/components/search';

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
