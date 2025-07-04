import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { AuthenticatedLayout } from '@/components/layouts/Authenticated';

export const Route = createFileRoute('/_authenticated')({
    beforeLoad: ({ context }) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!context.authentication?.authenticated) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href
                }
            });
        }
    },
    component: AuthenticatedPage
});

function AuthenticatedPage() {
    return (
        <AuthenticatedLayout>
            <Outlet />
        </AuthenticatedLayout>
    );
}
