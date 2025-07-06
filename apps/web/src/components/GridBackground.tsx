import { useIsMobile } from '@/hooks/useMobile';

export const GridBackground = () => {
    const isMobile = useIsMobile();

    const cols = isMobile ? 8 : 12;
    const rows = isMobile ? 6 : 8;
    const totalCells = cols * rows;
    const animationDuration = totalCells * 0.2 + 8;

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
            className={`fixed inset-0 pointer-events-none z-0 ${isMobile ? 'opacity-5' : 'opacity-10'}`}
            style={
                {
                    '--snake-animation-duration': `${animationDuration}s`
                } as React.CSSProperties
            }
        >
            <div
                className={`grid ${isMobile ? 'grid-cols-8 grid-rows-6' : 'grid-cols-12 grid-rows-8'} h-full w-full`}
            >
                {Array.from({ length: totalCells }).map((_, i) => (
                    <div
                        key={i}
                        className="border border-border relative overflow-hidden"
                    >
                        <div
                            className="snake-animation absolute inset-0"
                            style={{
                                animationDelay: `${getAnimationDelay(i)}s`
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
// import { useEffect, useState } from 'react';
// import { useIsMobile } from '@/hooks/useMobile';

// export const GridBackground = () => {
//     const isMobile = useIsMobile();
//     const [snakePosition, setSnakePosition] = useState(0);

//     const cols = isMobile ? 8 : 12;
//     const rows = isMobile ? 6 : 8;
//     const totalCells = cols * rows;

//     // Define a path for the snake to follow
//     const generateSnakePath = () => {
//         const path = [];

//         // Create a zigzag pattern
//         for (let row = 0; row < rows; row++) {
//             if (row % 2 === 0) {
//                 // Move right
//                 for (let col = 0; col < cols; col++) {
//                     path.push(row * cols + col);
//                 }
//             } else {
//                 // Move left
//                 for (let col = cols - 1; col >= 0; col--) {
//                     path.push(row * cols + col);
//                 }
//             }
//         }

//         return path;
//     };

//     const snakePath = generateSnakePath();
//     const snakeLength = isMobile ? 8 : 12;

//     useEffect(() => {
//         const interval = setInterval(() => {
//             setSnakePosition(
//                 (prev) => (prev + 1) % (snakePath.length + snakeLength)
//             );
//         }, 100);

//         return () => clearInterval(interval);
//     }, [snakePath.length, snakeLength]);

//     // Calculate which cells the snake occupies
//     const getSnakeCells = () => {
//         const cells = new Set();

//         for (let i = 0; i < snakeLength; i++) {
//             const pathIndex =
//                 (snakePosition - i + snakePath.length) % snakePath.length;
//             if (snakePosition - i >= 0) {
//                 cells.add(snakePath[pathIndex]);
//             }
//         }

//         return cells;
//     };

//     const snakeCells = getSnakeCells();

//     return (
//         <div
//             className={`fixed inset-0 pointer-events-none z-0 ${isMobile ? 'opacity-5' : 'opacity-10'}`}
//         >
//             <div
//                 className={`grid ${isMobile ? 'grid-cols-8 grid-rows-6' : 'grid-cols-12 grid-rows-8'} h-full w-full`}
//             >
//                 {Array.from({ length: totalCells }).map((_, i) => {
//                     const isSnake = snakeCells.has(i);
//                     const snakeIndex = Array.from(snakeCells).indexOf(i);
//                     const opacity = isSnake
//                         ? 1 - (snakeIndex / snakeLength) * 0.8
//                         : 0;

//                     // Cycle through accent colors
//                     const colorIndex = Math.floor(snakePosition / 20) % 3;
//                     const bgColor = [
//                         'bg-accent-1',
//                         'bg-accent-2',
//                         'bg-accent-3'
//                     ][colorIndex];

//                     return (
//                         <div
//                             key={i}
//                             className="border border-border relative overflow-hidden"
//                         >
//                             {isSnake && (
//                                 <div
//                                     className={`absolute inset-0 ${bgColor} transition-opacity duration-300`}
//                                     style={{ opacity }}
//                                 />
//                             )}
//                         </div>
//                     );
//                 })}
//             </div>
//         </div>
//     );
// };
