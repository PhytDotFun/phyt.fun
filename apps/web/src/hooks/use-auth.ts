import {
    usePrivy,
    useLoginWithOAuth,
    type PrivyErrorCode
} from '@privy-io/react-auth';
import { useCallback, useMemo } from 'react';

export const useAuth = ({
    onSignInComplete,
    onSignInError
}: {
    onSignInComplete?: () => void;
    onSignInError?: (error: PrivyErrorCode) => void;
} = {}) => {
    const { ready, authenticated, user, logout } = usePrivy();
    const { initOAuth, loading } = useLoginWithOAuth({
        onComplete: () => {
            onSignInComplete?.();
        },
        onError: (error) => {
            onSignInError?.(error);
        }
    });

    const signOut = useCallback(async () => {
        await logout();
    }, [logout]);

    const signIn = useCallback(async () => {
        await initOAuth({ provider: 'twitter' });
    }, [initOAuth]);

    return useMemo(
        () => ({
            signIn,
            signOut,
            authenticated,
            user,
            ready,
            loading
        }),
        [loading, signIn, signOut, authenticated, user, ready]
    );
};

export type AuthContext = ReturnType<typeof useAuth>;
