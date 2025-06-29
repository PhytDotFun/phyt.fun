import { createFileRoute, redirect } from '@tanstack/react-router';
import { Login } from '@/modules/auth/ui/components/Login';

export const Route = createFileRoute('/login')({
    beforeLoad: ({ context }) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (context.authentication?.authenticated) {
            throw redirect({ to: '/' });
        }
    },
    component: LoginPage
});

function LoginPage() {
    return <Login />;
}
