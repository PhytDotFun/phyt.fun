import { RouterProvider } from '@tanstack/react-router';
import PrivyAppProvider from './providers/PrivyProvider';
import { router } from './router';
import { useAuth } from './hooks/useAuth';
import { Loader } from './components/Loading';

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
            <InnerApp />
        </PrivyAppProvider>
    );
}

export default App;
