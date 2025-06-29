import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/competitions')({
    component: RouteComponent
});

function RouteComponent() {
    return <div>Hello /competitions!</div>;
}
