import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/_authenticated/activity')({
    component: ActivityPage
});

function ActivityPage() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-heading font-bold mb-6">Activity</h1>
            <p className="text-foreground">
                Activity page content goes here...
            </p>
        </div>
    );
}
