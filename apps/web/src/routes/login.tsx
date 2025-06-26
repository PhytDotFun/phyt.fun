import { createFileRoute } from '@tanstack/react-router';
import { Login } from "@/modules/layout/ui/components/Login";

export const Route = createFileRoute('/login')({
    component: LoginPage,
});

function LoginPage() {

    return <Login />;
}


