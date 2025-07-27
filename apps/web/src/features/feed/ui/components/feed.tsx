import { useFeed } from '@/hooks/feed/use-feed';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/loading';

import { FeedPost } from './feed-item';

export function Feed() {
    const {
        posts,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
        refetch
    } = useFeed(20);

    const handleRefetch = () => {
        void refetch();
    };

    const handleFetchNextPage = () => {
        void fetchNextPage();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <p className="text-red-500">
                    {error?.message || 'Something went wrong loading the feed'}
                </p>
                <Button onClick={handleRefetch}>Try Again</Button>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="flex justify-center items-center p-8">
                <p className="text-gray-500">No posts found</p>
            </div>
        );
    }

    return (
        <div className="feed-container">
            {/* Feed Posts */}
            <div className="space-y-4">
                {posts.map((post) => (
                    <FeedPost key={post.id} post={post} />
                ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
                <div className="flex justify-center py-6">
                    <Button
                        onClick={handleFetchNextPage}
                        disabled={isFetchingNextPage}
                        variant="default"
                    >
                        {isFetchingNextPage ? (
                            <>
                                <Loader />
                                Loading more...
                            </>
                        ) : (
                            'Load More'
                        )}
                    </Button>
                </div>
            )}

            {/* End of feed indicator */}
            {!hasNextPage && posts.length > 0 && (
                <div className="flex justify-center py-6">
                    <p className="text-gray-500">
                        You&apos;ve reached the end!
                    </p>
                </div>
            )}
        </div>
    );
}
