import { useIsMobile } from '@/hooks/use-mobile';

export const GridBackground = () => {
    const isMobile = useIsMobile();

    const cols = isMobile ? 8 : 12;
    const rows = isMobile ? 6 : 8;
    const totalCells = cols * rows;
    const animationDuration = totalCells * 0.5 + 8;

    const getAnimationDelay = (index: number) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        let position;
        if (row % 2 === 0) {
            position = row * cols + col;
        } else {
            position = row * cols + (cols - 1 - col);
        }

        return position * 0.4;
    };

    return (
        <div
            className={`fixed inset-0 pointer-events-none z-0 opacity-50 bg-main`}
            style={
                {
                    '--snake-animation-duration': `${animationDuration.toString()}s`
                } as React.CSSProperties
            }
        >
            <div
                className={`grid ${isMobile ? 'grid-cols-8 grid-rows-6' : 'grid-cols-12 grid-rows-8'} h-full w-full`}
            >
                {Array.from({ length: totalCells }).map((_, i) => (
                    <div
                        key={i}
                        className="border border-gray-400 relative overflow-hidden"
                    >
                        <div
                            className="snake-animation absolute inset-0"
                            style={{
                                animationDelay: `${getAnimationDelay(i).toString()}s`
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
