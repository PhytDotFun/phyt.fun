import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { ProfileLayout } from '@/components/layouts/profile-layout';

export const Route = createFileRoute('/_profile')({
    beforeLoad: ({ context }) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!context.authentication?.authenticated) {
            throw redirect({ to: '/login' });
        }
    },
    component: ProfilePage
});

function ProfilePage() {
    return (
        <ProfileLayout>
            <Outlet />
        </ProfileLayout>
    );
}
