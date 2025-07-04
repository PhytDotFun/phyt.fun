import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/_authenticated/leaderboard')({
    component: LeaderboardPage
});

function LeaderboardPage() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-heading font-bold mb-6">
                Leaderboard
            </h1>
            <p className="text-foreground">
                Leaderboard page content goes here...
            </p>
        </div>
    );
}
