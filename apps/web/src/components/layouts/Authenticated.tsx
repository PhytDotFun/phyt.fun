import { Header } from '../Header';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface AuthenticatedLayoutProps {
    children: React.ReactNode;
}

export const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full group/sidebar-wrapper">
                <div className="hidden md:block fixed left-0 top-0 w-4 h-full z-40 hover:w-8 transition-all duration-300" />

                <AppSidebar />
                <SidebarInset className="flex-1">
                    <Header />
                    <div className="flex-1 pt-20">{children}</div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
};
