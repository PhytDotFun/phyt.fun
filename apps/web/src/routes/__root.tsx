import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type { AuthContext } from '@/hooks/useAuth';

type RouterContext = {
    authentication: AuthContext;
};

export const Route = createRootRouteWithContext<RouterContext>()({
    component: RootComponent
});

function RootComponent() {
    return (
        <>
            <Outlet />
            <TanStackRouterDevtools />
        </>
    );
}
