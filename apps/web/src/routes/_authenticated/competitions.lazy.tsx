import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/_authenticated/competitions')({
    component: CompetitionsPage
});

function CompetitionsPage() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-heading font-bold mb-6">
                Competitions
            </h1>
            <p className="text-foreground">
                Competitions page content goes here...
            </p>
        </div>
    );
}
