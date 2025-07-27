import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Infer the Post type from the useFeed hook return type
type Post = NonNullable<
    ReturnType<typeof import('@/hooks/feed/use-feed').useFeed>['posts'][0]
>;

interface FeedPostProps {
    post: Post;
}

export const FeedPost = ({ post }: FeedPostProps) => {
    // Helper function to format pace (seconds per meter to min/km)
    const formatPace = (averagePace: number | null) => {
        if (!averagePace) return 'N/A';
        const paceMinPerKm = (averagePace * 1000) / 60;
        const minutes = Math.floor(paceMinPerKm);
        const seconds = Math.round((paceMinPerKm - minutes) * 60);
        return `${minutes.toString()}:${seconds.toString().padStart(2, '0')} min/km`;
    };

    // Helper function to format distance (meters to km)
    const formatDistance = (distance: number) => {
        return (distance / 1000).toFixed(2);
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage
                        src={post.user.profilePictureUrl}
                        alt={post.user.username}
                    />
                    <AvatarFallback>
                        {post.user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <p className="font-semibold text-sm">
                        {post.user.username}
                    </p>
                    <Badge variant="neutral" className="w-fit text-xs">
                        {post.user.role}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent>
                {/* Post content */}
                {post.content && (
                    <p className="text-foreground mb-4">{post.content}</p>
                )}

                {/* Run data */}
                <div className="bg-secondary-background rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Distance:</span>
                        <span>{formatDistance(post.run.distance)}km</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Duration:</span>
                        <span>
                            {Math.floor(post.run.duration / 60)}:
                            {(post.run.duration % 60)
                                .toString()
                                .padStart(2, '0')}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Pace:</span>
                        <span>{formatPace(post.run.averagePace)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Avg Heart Rate:</span>
                        <span>{post.run.averageHeartRate} bpm</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Max Heart Rate:</span>
                        <span>{post.run.maxHeartRate} bpm</span>
                    </div>
                    {post.run.isIndoor && (
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Type:</span>
                            <span>Indoor Run</span>
                        </div>
                    )}
                </div>

                {/* Post timestamp using run startTime */}
                <p className="text-sm text-gray-500 mt-4">
                    {new Date(post.run.startTime).toLocaleDateString()} at{' '}
                    {new Date(post.run.startTime).toLocaleTimeString()}
                </p>
            </CardContent>
        </Card>
    );
};
