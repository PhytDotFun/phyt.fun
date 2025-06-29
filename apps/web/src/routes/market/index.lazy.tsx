import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/market/')({
    component: RouteComponent
});

function RouteComponent() {
    return <div>Hello /market!</div>;
}
