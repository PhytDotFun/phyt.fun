import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

export const router = createRouter({
    routeTree,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    context: { authentication: undefined! },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0
});
