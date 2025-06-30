import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/$profileId')({
    component: RouteComponent
});

function RouteComponent() {
    return <div>Hello /$profileId!</div>;
}
