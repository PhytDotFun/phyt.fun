import { useNavigate } from '@tanstack/react-router';
import { useLoginWithOAuth } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/logo';
import { GridBackground } from '@/components/grid-background';
import { XIcon } from '@/assets/icons/X';

export const Login = () => {
    const isMobile = useIsMobile();

    const { authenticated, user } = useAuth();
    const navigate = useNavigate();
    const [hasLoggedIn, setHasLoggedIn] = useState(false);
    const { loading, initOAuth } = useLoginWithOAuth({
        onComplete: ({ user }) => {
            console.log('User logged in:', user);
            void navigate({ to: '/' });
        },
        onError: (error) => {
            console.error('Login failed:', error);
        }
    });

    useEffect(() => {
        if (authenticated && user && !hasLoggedIn) {
            console.log('Existing user logged in:', user);
            setHasLoggedIn(true);
            void navigate({ to: '/' });
        }
    }, [authenticated, user, navigate, hasLoggedIn]);

    const handleLogin = async () => {
        try {
            await initOAuth({ provider: 'twitter' });
        } catch (error) {
            console.error('OAuth failed:', error);
        }
    };

    return (
        <div
            className={`bg-secondary-background relative ${isMobile ? 'h-[89vh]' : 'h-screen'}`}
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
                        onClick={() => void handleLogin()}
                        disabled={loading}
                        className="bg-black text-white font-bold text-lg hover:cursor-pointer"
                        variant={isMobile ? 'noShadow' : 'reverse'}
                    >
                        <XIcon className="mr-2" size={isMobile ? 20 : 40} />
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
