import { ArrowRight, Star, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const MOCK_TRENDING = [
    {
        id: 1,
        name: 'LIGHTNING_BOLT',
        avatar: '/placeholder.svg?height=32&width=32',
        price: '$156.78',
        change: '+12.4%',
        isUp: true,
        rank: 1,
        category: 'SPRINTER'
    },
    {
        id: 2,
        name: 'MARATHON_QUEEN',
        avatar: '/placeholder.svg?height=32&width=32',
        price: '$234.56',
        change: '+8.9%',
        isUp: true,
        rank: 2,
        category: 'ENDURANCE'
    },
    {
        id: 3,
        name: 'SPEED_RACER',
        avatar: '/placeholder.svg?height=32&width=32',
        price: '$89.12',
        change: '+7.2%',
        isUp: true,
        rank: 3,
        category: 'MIDDLE_DISTANCE'
    },
    {
        id: 4,
        name: 'TRAIL_BLAZER',
        avatar: '/placeholder.svg?height=32&width=32',
        price: '$67.89',
        change: '-2.1%',
        isUp: false,
        rank: 4,
        category: 'TRAIL'
    },
    {
        id: 5,
        name: 'CITY_RUNNER',
        avatar: '/placeholder.svg?height=32&width=32',
        price: '$45.67',
        change: '+3.8%',
        isUp: true,
        rank: 5,
        category: 'URBAN'
    }
];

export function HomeTrendingPanel() {
    return (
        <div className="h-full flex flex-col">
            <div className="border-b-2 border-border bg-secondary-background p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-mono font-bold text-foreground flex items-center gap-2">
                        <Star className="size-5" />
                        TRENDING
                    </h2>
                    <Button variant="noShadow" size="sm" className="font-mono">
                        TOP_100
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                    {MOCK_TRENDING.map((runner) => (
                        <Card
                            key={runner.id}
                            className="border-2 border-border"
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="font-mono font-bold text-lg w-6 text-center">
                                            #{runner.rank}
                                        </div>
                                        <Avatar className="size-8 border-2 border-border">
                                            <AvatarImage
                                                src={
                                                    runner.avatar ||
                                                    '/placeholder.svg'
                                                }
                                            />
                                            <AvatarFallback className="font-mono font-bold text-xs">
                                                {runner.name.slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-mono font-bold text-sm truncate">
                                                {runner.name}
                                            </div>
                                            <Badge
                                                variant="neutral"
                                                className="font-mono text-xs mt-1"
                                            >
                                                {runner.category}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-mono font-bold text-sm">
                                            {runner.price}
                                        </div>
                                        <div
                                            className={`flex items-center gap-1 text-xs font-mono ${
                                                runner.isUp
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                            }`}
                                        >
                                            {runner.isUp ? (
                                                <TrendingUp className="size-3" />
                                            ) : (
                                                <TrendingDown className="size-3" />
                                            )}
                                            {runner.change}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    className="w-full mt-3 font-mono font-bold text-xs"
                                    variant="noShadow"
                                >
                                    TRADE_TOKEN
                                    <ArrowRight className="size-3 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
