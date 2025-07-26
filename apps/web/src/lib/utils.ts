import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Activity, BarChart3, Home, Store, Trophy, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ClassValue } from 'clsx';
import { getAccessToken } from '@privy-io/react-auth';

export function cn(...inputs: Array<ClassValue>) {
    return twMerge(clsx(inputs));
}

const iconMap: Record<string, LucideIcon> = {
    Home,
    Store,
    Activity,
    Trophy,
    Leaderboard: BarChart3,
    User
};

export function getIconComponent(iconName: string): LucideIcon {
    return iconName in iconMap ? iconMap[iconName] : Home;
}

// Token caching utility with metrics
interface CachedTokens {
    accessToken: string | null;
    idToken: string | null;
    expires: number;
    fetchedAt: number;
}

interface TokenMetrics {
    cacheHits: number;
    cacheMisses: number;
    privyApiCalls: number;
    lastPrivyCall: number;
}

let tokenCache: CachedTokens | null = null;
const metrics: TokenMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    privyApiCalls: 0,
    lastPrivyCall: 0
};

// Cache tokens for 55 minutes (tokens typically expire in 60 minutes)
const TOKEN_CACHE_DURATION = 55 * 60 * 1000; // 55 minutes in milliseconds

// Store the getIdToken function reference when available
let getIdTokenFn: (() => Promise<string | null>) | null = null;

// Function to set the idToken getter (to be called from React components)
export function setIdTokenGetter(getter: () => Promise<string | null>) {
    getIdTokenFn = getter;
}

export async function getCachedTokens(): Promise<{
    accessToken: string | null;
    idToken: string | null;
}> {
    const now = Date.now();

    // Return cached tokens if they're still valid
    if (tokenCache && tokenCache.expires > now && tokenCache.accessToken) {
        metrics.cacheHits++;

        // Log cache efficiency every 10 hits
        if (metrics.cacheHits % 10 === 0) {
            logTokenMetrics();
        }

        return {
            accessToken: tokenCache.accessToken,
            idToken: tokenCache.idToken
        };
    }

    // Cache miss - need to fetch from Privy
    metrics.cacheMisses++;
    metrics.privyApiCalls++;
    metrics.lastPrivyCall = now;

    const timeSinceLastCall = tokenCache ? now - tokenCache.fetchedAt : 0;
    console.log(
        `🔄 Fetching fresh tokens from Privy (cache miss #${metrics.cacheMisses.toString()})`,
        {
            timeSinceLastFetch:
                timeSinceLastCall > 0
                    ? `${Math.round(timeSinceLastCall / 1000).toString()}s ago`
                    : 'first call',
            reason: !tokenCache
                ? 'no cache'
                : tokenCache.expires <= now
                  ? 'expired'
                  : 'invalid tokens'
        }
    );

    try {
        // Get fresh tokens from Privy
        const accessToken = await getAccessToken();
        let idToken: string | null = null;

        // Try to get idToken if the getter function is available
        if (getIdTokenFn) {
            try {
                idToken = await getIdTokenFn();
            } catch (error) {
                console.warn('Failed to get idToken:', error);
                // Continue without idToken - don't fail the entire request
            }
        }

        // Cache the tokens with expiration
        tokenCache = {
            accessToken,
            idToken,
            expires: now + TOKEN_CACHE_DURATION,
            fetchedAt: now
        };

        console.log(
            `✅ Fresh tokens cached for ${(TOKEN_CACHE_DURATION / 60000).toString()} minutes`,
            { hasIdToken: !!idToken }
        );
        logTokenMetrics();

        return { accessToken, idToken };
    } catch (error) {
        console.warn('❌ Failed to get tokens from Privy:', error);
        return { accessToken: null, idToken: null };
    }
}

// Backwards compatibility for existing accessToken usage
export async function getCachedAccessToken(): Promise<string | null> {
    const { accessToken } = await getCachedTokens();
    return accessToken;
}

// New function for getting cached idToken
export async function getCachedIdToken(): Promise<string | null> {
    const { idToken } = await getCachedTokens();
    return idToken;
}

// Clear the token cache (useful for logout or auth errors)
export function clearTokenCache(): void {
    if (tokenCache) {
        console.log('🧹 Clearing token cache');
    }
    tokenCache = null;
}

// Log token usage metrics
function logTokenMetrics(): void {
    const total = metrics.cacheHits + metrics.cacheMisses;
    const cacheHitRate =
        total > 0 ? ((metrics.cacheHits / total) * 100).toFixed(1) : '0';
    const timeSinceLastCall =
        metrics.lastPrivyCall > 0 ? Date.now() - metrics.lastPrivyCall : 0;

    console.log(`📊 Token Cache Metrics:`, {
        cacheHitRate: `${cacheHitRate}% (${metrics.cacheHits.toString()}/${total.toString()})`,
        privyApiCalls: metrics.privyApiCalls.toString(),
        lastCallAgo:
            timeSinceLastCall > 0
                ? `${Math.round(timeSinceLastCall / 1000).toString()}s ago`
                : 'never',
        status:
            metrics.cacheHits > metrics.cacheMisses
                ? '✅ Efficient'
                : '⚠️ Check usage'
    });
}

// Export metrics for debugging
export function getTokenMetrics(): TokenMetrics & { cacheHitRate: string } {
    const total = metrics.cacheHits + metrics.cacheMisses;
    const cacheHitRate =
        total > 0 ? ((metrics.cacheHits / total) * 100).toFixed(1) + '%' : '0%';

    return {
        ...metrics,
        cacheHitRate
    };
}
