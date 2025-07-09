import { PrivyProvider } from '@privy-io/react-auth';
import { env } from '../env';

export default function PrivyAppProvider({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <PrivyProvider
            appId={env.VITE_PRIVY_APP_ID}
            clientId={env.VITE_PRIVY_CLIENT_ID}
            config={{
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets'
                    }
                },
                loginMethods: ['twitter']
            }}
        >
            {children}
        </PrivyProvider>
    );
}
