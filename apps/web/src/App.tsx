import { RouterProvider } from '@tanstack/react-router';
import { Loader } from 'lucide-react';
import PrivyAppProvider from './providers/PrivyProvider';
import { router } from './router';
import { useAuth } from './hooks/useAuth';

function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <Loader className="animate-spin rounded-full h-12 w-12 border-b-2 border-main mx-auto mb-4" />
                <p className="text-foreground font-main">Loading...</p>
            </div>
        </div>
    );
}

function InnerApp() {
    const authentication = useAuth();

    if (!authentication.ready) {
        return <Loading />;
    }

    return <RouterProvider router={router} context={{ authentication }} />;
}

function App() {
    return (
        <PrivyAppProvider>
            <InnerApp />
        </PrivyAppProvider>
    );
}

export default App;
