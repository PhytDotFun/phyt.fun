import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useMemo } from "react";

export const useAuth = () => {
    const { ready, authenticated, user, logout } = usePrivy();

    const signOut = useCallback(async () => {
        if (!ready) return;
        await logout();
    }, [ready, logout]);

    return useMemo(() => ({
        signOut,
        authenticated,
        user,
        loading: !ready,
        ready
    }), [signOut, authenticated, user, ready]);
};

export type AuthContext = ReturnType<typeof useAuth>;
