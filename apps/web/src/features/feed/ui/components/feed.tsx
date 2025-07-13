'use client';

import { useState } from 'react';
import { Clock, Filter, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const FILTER_OPTIONS = ['ALL', 'FOLLOWING', 'TRENDING', 'NEW'];

const MOCK_RUNS = [
    {
        id: 1,
        runner: 'ALEX_STORM',
        avatar: '/placeholder.svg?height=40&width=40',
        distance: '5.2 KM',
        time: '22:15',
        pace: '4:17/KM',
        location: 'CENTRAL_PARK',
        timestamp: '2H AGO',
        price: '$45.20',
        change: '+2.3%',
        isUp: true
    },
    {
        id: 2,
        runner: 'SARAH_SPEED',
        avatar: '/placeholder.svg?height=40&width=40',
        distance: '10.0 KM',
        time: '38:42',
        pace: '3:52/KM',
        location: 'BROOKLYN_BRIDGE',
        timestamp: '4H AGO',
        price: '$67.80',
        change: '-1.2%',
        isUp: false
    },
    {
        id: 3,
        runner: 'MIKE_MARATHON',
        avatar: '/placeholder.svg?height=40&width=40',
        distance: '21.1 KM',
        time: '1:32:18',
        pace: '4:22/KM',
        location: 'RIVERSIDE_DRIVE',
        timestamp: '6H AGO',
        price: '$123.45',
        change: '+5.7%',
        isUp: true
    },
    {
        id: 4,
        runner: 'JENNY_FLASH',
        avatar: '/placeholder.svg?height=40&width=40',
        distance: '3.5 KM',
        time: '12:30',
        pace: '3:34/KM',
        location: 'TIMES_SQUARE',
        timestamp: '8H AGO',
        price: '$28.90',
        change: '+0.8%',
        isUp: true
    },
    {
        id: 5,
        runner: 'TOM_THUNDER',
        avatar: '/placeholder.svg?height=40&width=40',
        distance: '15.0 KM',
        time: '58:45',
        pace: '3:55/KM',
        location: 'PROSPECT_PARK',
        timestamp: '12H AGO',
        price: '$89.15',
        change: '-3.1%',
        isUp: false
    }
];

export function Feed() {
    const [activeFilter, setActiveFilter] = useState('ALL');

    return (
        <div className="h-full flex flex-col">
            {/* Filter Header */}
            <div className="border-b-2 border-border bg-secondary-background p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-mono font-bold text-foreground">
                        RUNNER_FEED
                    </h2>
                    <Button variant="noShadow" size="sm" className="font-mono">
                        <Filter className="size-4 mr-2" />
                        FILTER
                    </Button>
                </div>

                <div className="flex gap-2 flex-wrap">
                    {FILTER_OPTIONS.map((filter) => (
                        <Button
                            key={filter}
                            variant={
                                activeFilter === filter ? 'default' : 'neutral'
                            }
                            size="sm"
                            onClick={() => {
                                setActiveFilter(filter);
                            }}
                            className="font-mono font-bold"
                        >
                            {filter}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Feed Content */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {MOCK_RUNS.map((run) => (
                        <Card key={run.id} className="border-2 border-border">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10 border-2 border-border">
                                            <AvatarImage
                                                src={
                                                    run.avatar ||
                                                    '/placeholder.svg'
                                                }
                                            />
                                            <AvatarFallback className="font-mono font-bold">
                                                {run.runner.slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="font-mono text-lg">
                                                {run.runner}
                                            </CardTitle>
                                            <div className="flex items-center gap-2 text-sm text-foreground/70">
                                                <Clock className="size-3" />
                                                <span className="font-mono">
                                                    {run.timestamp}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-lg">
                                            {run.price}
                                        </div>
                                        <Badge
                                            variant={
                                                run.isUp ? 'default' : 'neutral'
                                            }
                                            className={`font-mono ${run.isUp ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                                        >
                                            {run.change}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-0">
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="font-mono font-bold text-xl">
                                            {run.distance}
                                        </div>
                                        <div className="text-sm text-foreground/70 font-mono">
                                            DISTANCE
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-mono font-bold text-xl">
                                            {run.time}
                                        </div>
                                        <div className="text-sm text-foreground/70 font-mono">
                                            TIME
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-mono font-bold text-xl">
                                            {run.pace}
                                        </div>
                                        <div className="text-sm text-foreground/70 font-mono">
                                            PACE
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="size-4" />
                                    <span className="font-mono font-bold">
                                        {run.location}
                                    </span>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        className="flex-1 font-mono font-bold"
                                    >
                                        BUY_TOKEN
                                    </Button>
                                    <Button
                                        variant="neutral"
                                        size="sm"
                                        className="flex-1 font-mono font-bold"
                                    >
                                        VIEW_DETAILS
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
