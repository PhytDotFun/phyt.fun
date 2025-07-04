import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/market/$itemId')({
    component: MarketItemPage
});

function MarketItemPage() {
    const { itemId } = Route.useParams();

    return (
        <div className="p-6">
            <h1 className="text-3xl font-heading font-bold mb-6">
                Market Item: {itemId}
            </h1>
            <p className="text-foreground">Market item details go here...</p>
        </div>
    );
}
