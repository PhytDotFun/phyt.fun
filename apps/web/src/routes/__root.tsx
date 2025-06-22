import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
    component: () => (
        <>
            <div>
                <p>Hello</p>
            </div>
            <Outlet />
            <TanStackRouterDevtools />
        </>
    ),
});
