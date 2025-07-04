import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/_profile/$profileId')({
    component: ProfilePage
});

function ProfilePage() {
    const { profileId } = Route.useParams();

    return (
        <div className="min-h-screen p-6">
            <h1 className="text-3xl font-heading font-bold mb-6">
                Profile: {profileId}
            </h1>
            <p className="text-foreground">Profile page content goes here...</p>
            <p className="text-foreground text-sm mt-4">
                Note: This profile page has no header or sidebar as requested.
            </p>
        </div>
    );
}
