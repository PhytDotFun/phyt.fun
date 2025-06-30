import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/market/$tokenId')({
    component: RouteComponent
});

function RouteComponent() {
    return <div>Hello /market/$tokenId!</div>;
}
