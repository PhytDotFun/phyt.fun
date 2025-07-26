import {
    usePrivy,
    useLoginWithOAuth,
    useIdentityToken,
    type PrivyErrorCode
} from '@privy-io/react-auth';
import { useCallback, useMemo, useEffect } from 'react';

import { clearTokenCache, setIdTokenGetter } from '@/lib/utils';

export const useAuth = ({
    onSignInComplete,
    onSignInError
}: {
    onSignInComplete?: () => void;
    onSignInError?: (error: PrivyErrorCode) => void;
} = {}) => {
    const { ready, authenticated, user, logout } = usePrivy();
    const { identityToken } = useIdentityToken();
    const { initOAuth, loading } = useLoginWithOAuth({
        onComplete: () => {
            onSignInComplete?.();
        },
        onError: (error) => {
            onSignInError?.(error);
        }
    });

    // Set up the idToken getter function
    useEffect(() => {
        if (ready && authenticated) {
            const getIdToken = () => {
                try {
                    return Promise.resolve(identityToken);
                } catch (error: unknown) {
                    console.warn('Failed to get idToken:', error);
                    return Promise.resolve(null);
                }
            };
            setIdTokenGetter(getIdToken);
        }
    }, [ready, authenticated, identityToken]);

    // Clear token cache when user becomes unauthenticated
    useEffect(() => {
        if (ready && !authenticated) {
            clearTokenCache();
        }
    }, [ready, authenticated]);

    const signOut = useCallback(async () => {
        // Clear the token cache before logging out
        clearTokenCache();
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
