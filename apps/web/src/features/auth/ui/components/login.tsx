import { useEffect, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useLoginWithOAuth } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/logo';
import { GridBackground } from '@/components/grid-background';

export const Login = () => {
    const isMobile = useIsMobile();

    const { authenticated, user } = useAuth();
    const navigate = useNavigate();
    const [hasLoggedIn, setHasLoggedIn] = useState(false);
    const { loading, initOAuth } = useLoginWithOAuth({
        onError: (error) => {
            console.error('Login failed:', error);
        }
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
        <div
            className={`bg-white relative ${isMobile ? 'h-[89vh]' : 'h-screen'}`}
        >
            <GridBackground />
            <div
                className={`relative z-10 flex flex-col items-center justify-between px-4 h-full`}
            >
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <Logo
                        type="login"
                        className="hover:scale-110 hover:cursor-default transition-transform duration-300 mb-3"
                    />
                    <Button
                        onClick={handleLogin}
                        disabled={loading}
                        className="bg-black text-white font-bold text-lg hover:cursor-pointer"
                        variant={isMobile ? 'noShadow' : 'reverse'}
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
