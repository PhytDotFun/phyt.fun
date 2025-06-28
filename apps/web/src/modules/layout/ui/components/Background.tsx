import { useIsMobile } from "@/hooks/useMobile";

export const GridBackground = () => {
    const isMobile = useIsMobile();

    return (
        <div className={`fixed inset-0 pointer-events-none z-0 ${isMobile ? 'opacity-5' : 'opacity-10'}`}>
            <div className={`grid ${isMobile ? 'grid-cols-8 grid-rows-6' : 'grid-cols-12 grid-rows-8'} h-full w-full`}>
                {Array.from({ length: isMobile ? 48 : 96 }).map((_, i) => (
                    <div key={i} className="border border-border" />
                ))}
            </div>
        </div>
    );
};
