import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/_authenticated/market')({
    component: MarketPage
});

function MarketPage() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-heading font-bold mb-6">Market</h1>
            <p className="text-foreground">Market page content goes here...</p>
        </div>
    );
}
