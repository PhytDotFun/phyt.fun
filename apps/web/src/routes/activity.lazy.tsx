import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/activity')({
    component: RouteComponent
});

function RouteComponent() {
    return <div>Hello /activity!</div>;
}
