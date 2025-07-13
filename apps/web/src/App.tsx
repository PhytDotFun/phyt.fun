import { RouterProvider } from '@tanstack/react-router';

import PrivyAppProvider from './providers/privy-provider';
import QueryClientAppProvider from './providers/query-provider';
import { router } from './router';
import { useAuth } from './hooks/use-auth';
import { Loader } from './components/loading';

function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <Loader />
                <p className="text-black">LOADING</p>
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
            <QueryClientAppProvider>
                <InnerApp />
            </QueryClientAppProvider>
        </PrivyAppProvider>
    );
}

export default App;
