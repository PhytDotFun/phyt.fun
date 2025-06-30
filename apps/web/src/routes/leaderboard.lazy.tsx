import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/leaderboard')({
    component: RouteComponent
});

function RouteComponent() {
    return <div>Hello /leaderboard!</div>;
}
