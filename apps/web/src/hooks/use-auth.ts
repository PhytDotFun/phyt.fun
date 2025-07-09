import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useMemo } from 'react';

export const useAuth = () => {
    const { ready, authenticated, user, logout } = usePrivy();

    const signOut = useCallback(async () => {
        await logout();
    }, [logout]);

    return useMemo(
        () => ({
            signOut,
            authenticated,
            user,
            ready
        }),
        [signOut, authenticated, user, ready]
    );
};

export type AuthContext = ReturnType<typeof useAuth>;
