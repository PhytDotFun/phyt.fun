import { createFileRoute, redirect } from '@tanstack/react-router';

import { Login } from '@/features/auth/ui/components/login';

export const Route = createFileRoute('/login')({
    beforeLoad: ({ context }) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (context.authentication?.authenticated) {
            // Throwing the redirect is the correct pattern for tanstack router
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw redirect({ to: '/' });
        }
    },
    component: LoginPage
});

function LoginPage() {
    return <Login />;
}
