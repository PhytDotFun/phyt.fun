import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
    component: HomePage,
});

function HomePage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center">
                <h1 className="text-4xl font-black text-foreground mb-4">
                    Welcome to PHYT
                </h1>
                <p className="text-lg text-foreground/80 mb-8">
                    Your fitness journey starts here
                </p>

                {/* Add some placeholder content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    <div className="p-6 border-2 border-border rounded-base bg-secondary-background">
                        <h3 className="text-xl font-bold mb-2">Competitions</h3>
                        <p className="text-foreground/70">Join fitness challenges and compete with others</p>
                    </div>
                    <div className="p-6 border-2 border-border rounded-base bg-secondary-background">
                        <h3 className="text-xl font-bold mb-2">Market</h3>
                        <p className="text-foreground/70">Trade fitness NFTs and earn rewards</p>
                    </div>
                    <div className="p-6 border-2 border-border rounded-base bg-secondary-background">
                        <h3 className="text-xl font-bold mb-2">Profile</h3>
                        <p className="text-foreground/70">Track your progress and achievements</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
