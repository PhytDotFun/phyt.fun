import { useLoginWithOAuth, usePrivy } from "@privy-io/react-auth";

export const useAuth = () => {
    const { ready, authenticated, logout } = usePrivy();
    const { state, loading, initOAuth } = useLoginWithOAuth();

    const signIn = async () => {
        try {
            if (!ready) return;
            await initOAuth({ provider: 'twitter' });
        } catch (error) {
            console.error(error);
        }
    };

    const signOut = () => {
        if (!ready) return;
        logout();
    };

    return { signIn, signOut, authenticated, loading, state };
};

export type AuthContext = ReturnType<typeof useAuth>;
