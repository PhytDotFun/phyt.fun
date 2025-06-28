import { useEffect, useState } from "react";
import { BicepsFlexed, Dumbbell } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useLoginWithOAuth } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useMobile";
import { useAuth } from "@/hooks/useAuth";

export const Login = () => {
    const isMobile = useIsMobile();
    const [isHovered, setIsHovered] = useState(false);
    const { authenticated, user } = useAuth();
    const navigate = useNavigate();
    const [hasLoggedIn, setHasLoggedIn] = useState(false);

    const { loading, initOAuth } = useLoginWithOAuth({
        onError: (error) => {
            console.error("Login failed:", error);
        },
    });

    useEffect(() => {
        if (authenticated && user && !hasLoggedIn) {
            console.log('Existing user logged in:', user);
            setHasLoggedIn(true);
            navigate({ to: '/' });
        }
    }, [authenticated, user, navigate, hasLoggedIn]);

    const handleLogin = async () => {
        await initOAuth({ provider: 'twitter' });
    };

    return (
        <div className="min-h-screen bg-white relative overflow-hidden">
            <div className="absolute inset-0">
                <div
                    className={`absolute ${isMobile ? 'w-20 h-20' : 'w-32 h-32'} bg-neon-yellow border-4 border-black shadow-brutal rounded-none flex items-center justify-center`}
                    style={{
                        left: isMobile ? '20px' : '50px',
                        top: isMobile ? '50px' : '100px',
                        transform: 'rotate(15deg)'
                    }}
                >
                    <Dumbbell size={isMobile ? 24 : 48} className="text-black" />
                </div>

                <div
                    className={`absolute ${isMobile ? 'w-16 h-16' : 'w-24 h-24'} bg-neon-blue border-4 border-black shadow-brutal flex items-center justify-center`}
                    style={{
                        right: isMobile ? '50px' : '100px',
                        top: isMobile ? '100px' : '200px',
                        transform: 'rotate(-20deg)'
                    }}
                >
                    <BicepsFlexed size={isMobile ? 20 : 32} className="text-black" />
                </div>

                <div
                    className={`absolute ${isMobile ? 'w-24 h-12' : 'w-40 h-20'} bg-neon-pink border-4 border-black shadow-brutal flex items-center justify-center`}
                    style={{
                        left: isMobile ? '100px' : '200px',
                        bottom: isMobile ? '100px' : '150px',
                        transform: 'rotate(10deg)'
                    }}
                >
                    <span className={`text-black font-black ${isMobile ? 'text-sm' : 'text-lg'}`}>REP</span>
                </div>
                <div className={`absolute top-20 left-4 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-neon-green border-4 border-black shadow-brutal animate-pulse flex items-center justify-center`}>
                    <Dumbbell size={isMobile ? 16 : 24} className="text-black" />
                </div>
                <div className={`absolute top-40 right-4 ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-neon-purple border-4 border-black shadow-brutal animate-bounce flex items-center justify-center`}>
                    <span className={`text-black font-black ${isMobile ? 'text-xs' : 'text-xs'}`}>💪</span>
                </div>
                <div className={`absolute bottom-32 left-1/4 ${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-neon-yellow border-4 border-black shadow-brutal animate-pulse flex items-center justify-center`}>
                    <BicepsFlexed size={isMobile ? 20 : 28} className="text-black" />
                </div>
                {!isMobile && (
                    <>
                        <div className="absolute top-1/4 left-16 text-black font-black text-lg opacity-60 animate-bounce">
                            TRAIN HARD
                        </div>
                        <div className="absolute top-1/3 right-24 text-black font-black text-lg opacity-60 animate-pulse">
                            GET STRONG
                        </div>
                        <div className="absolute bottom-1/3 left-1/3 text-black font-black text-lg opacity-60 animate-bounce delay-300">
                            NO EXCUSES
                        </div>
                    </>
                )}
                <div className={`absolute inset-0 ${isMobile ? 'opacity-5' : 'opacity-10'}`}>
                    <div className={`grid ${isMobile ? 'grid-cols-8 grid-rows-6' : 'grid-cols-12 grid-rows-8'} h-full`}>
                        {Array.from({ length: isMobile ? 48 : 96 }).map((_, i) => (
                            <div key={i} className="border border-black" />
                        ))}
                    </div>
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
                <div className="text-center mb-16 md:mb-32">
                    <h1 className={`${isMobile ? 'text-5xl' : 'text-8xl'} font-black text-black mb-4 transform hover:scale-110 transition-transform duration-300`}>
                        PHYT
                    </h1>
                    <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-black`}>
                        FITNESS LAUNCHPAD
                    </p>
                    <div className="mt-6 flex justify-center space-x-4">
                        <div className="w-4 h-4 bg-neon-blue border-2 border-black animate-pulse" />
                        <div className="w-4 h-4 bg-neon-green border-2 border-black animate-pulse delay-150" />
                        <div className="w-4 h-4 bg-neon-pink border-2 border-black animate-pulse delay-300" />
                    </div>
                </div>
                <div className="mt-auto mb-16 md:mb-32">
                    <Button
                        onClick={handleLogin}
                        disabled={loading}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className={`
                            brutal-button ${isMobile ? 'text-lg py-4 px-8' : 'text-2xl py-6 px-12'} font-black bg-white hover:bg-neon-yellow
                            transition-all duration-300 transform
                            ${isHovered ? 'scale-110 shadow-brutal-xl' : 'shadow-brutal-lg'}
                            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <Dumbbell className="mr-3" size={isMobile ? 20 : 28} />
                        {loading ? 'CONNECTING...' : 'LOGIN TO PHYT'}
                    </Button>
                </div>
            </div>
            <div className="absolute top-4 left-4 w-8 h-8 bg-black" />
            <div className="absolute top-4 right-4 w-8 h-8 bg-black" />
            <div className="absolute bottom-4 left-4 w-8 h-8 bg-black" />
            <div className="absolute bottom-4 right-4 w-8 h-8 bg-black" />
        </div>
    );
};
