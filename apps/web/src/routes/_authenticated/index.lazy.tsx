import { createLazyFileRoute } from '@tanstack/react-router';
import { Home } from '@/components/Home';

export const Route = createLazyFileRoute('/_authenticated/')({
    component: HomePage
});

function HomePage() {
    return <Home />;
}
