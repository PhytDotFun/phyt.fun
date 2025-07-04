import { ArrowRight, Calendar, Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const MOCK_COMPETITIONS = [
    {
        id: 1,
        name: 'WEEKLY_5K_CHALLENGE',
        participants: 1247,
        prize: '$5,000',
        endDate: '2D 14H',
        status: 'ACTIVE',
        category: 'DISTANCE'
    },
    {
        id: 2,
        name: 'SPEED_DEMON_SPRINT',
        participants: 892,
        prize: '$2,500',
        endDate: '5D 8H',
        status: 'ACTIVE',
        category: 'SPEED'
    },
    {
        id: 3,
        name: 'MARATHON_MASTERS',
        participants: 456,
        prize: '$10,000',
        endDate: '12D 3H',
        status: 'UPCOMING',
        category: 'ENDURANCE'
    },
    {
        id: 4,
        name: 'CITY_CIRCUIT_RACE',
        participants: 2103,
        prize: '$7,500',
        endDate: '1D 22H',
        status: 'ENDING_SOON',
        category: 'CIRCUIT'
    }
];

export function HomeCompetitionsPanel() {
    return (
        <div className="h-full flex flex-col">
            <div className="border-b-2 border-border bg-secondary-background p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-mono font-bold text-foreground flex items-center gap-2">
                        <Trophy className="size-5" />
                        COMPETITIONS
                    </h2>
                    <Button variant="noShadow" size="sm" className="font-mono">
                        VIEW_ALL
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {MOCK_COMPETITIONS.map((comp) => (
                        <Card key={comp.id} className="border-2 border-border">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="font-mono text-base mb-2">
                                            {comp.name}
                                        </CardTitle>
                                        <div className="flex gap-2">
                                            <Badge
                                                variant={
                                                    comp.status === 'ACTIVE'
                                                        ? 'default'
                                                        : 'neutral'
                                                }
                                                className="font-mono text-xs"
                                            >
                                                {comp.status}
                                            </Badge>
                                            <Badge
                                                variant="neutral"
                                                className="font-mono text-xs"
                                            >
                                                {comp.category}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-lg text-green-600">
                                            {comp.prize}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-0">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="size-4" />
                                        <span className="font-mono">
                                            {comp.participants} RUNNERS
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="size-4" />
                                        <span className="font-mono">
                                            {comp.endDate}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    className="w-full font-mono font-bold"
                                    variant={
                                        comp.status === 'UPCOMING'
                                            ? 'neutral'
                                            : 'default'
                                    }
                                >
                                    {comp.status === 'UPCOMING'
                                        ? 'REGISTER'
                                        : 'JOIN_NOW'}
                                    <ArrowRight className="size-4 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
