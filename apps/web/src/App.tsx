import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export const router = createRouter({
    routeTree,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    context: { authentication: undefined! },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

function App() {
    return <RouterProvider router={router} />;
}

export default App;
