import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="skeleton"
            className={cn(
                'animate-pulse-bg rounded-md border-2 border-border',
                className
            )}
            {...props}
        />
    );
}

export { Skeleton };
