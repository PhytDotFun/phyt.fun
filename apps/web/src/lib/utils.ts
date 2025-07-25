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
interface CachedToken {
    token: string | null;
    expires: number;
    fetchedAt: number;
}

interface TokenMetrics {
    cacheHits: number;
    cacheMisses: number;
    privyApiCalls: number;
    lastPrivyCall: number;
}

let tokenCache: CachedToken | null = null;
const metrics: TokenMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    privyApiCalls: 0,
    lastPrivyCall: 0
};

// Cache tokens for 55 minutes (tokens typically expire in 60 minutes)
const TOKEN_CACHE_DURATION = 55 * 60 * 1000; // 55 minutes in milliseconds

export async function getCachedAccessToken(): Promise<string | null> {
    const now = Date.now();

    // Return cached token if it's still valid
    if (tokenCache && tokenCache.expires > now && tokenCache.token) {
        metrics.cacheHits++;

        // Log cache efficiency every 10 hits
        if (metrics.cacheHits % 10 === 0) {
            logTokenMetrics();
        }

        return tokenCache.token;
    }

    // Cache miss - need to fetch from Privy
    metrics.cacheMisses++;
    metrics.privyApiCalls++;
    metrics.lastPrivyCall = now;

    const timeSinceLastCall = tokenCache ? now - tokenCache.fetchedAt : 0;
    console.log(
        `🔄 Fetching fresh token from Privy (cache miss #${metrics.cacheMisses.toString()})`,
        {
            timeSinceLastFetch:
                timeSinceLastCall > 0
                    ? `${Math.round(timeSinceLastCall / 1000).toString()}s ago`
                    : 'first call',
            reason: !tokenCache
                ? 'no cache'
                : tokenCache.expires <= now
                  ? 'expired'
                  : 'invalid token'
        }
    );

    try {
        // Get fresh token from Privy
        const token = await getAccessToken();

        // Cache the token with expiration
        tokenCache = {
            token,
            expires: now + TOKEN_CACHE_DURATION,
            fetchedAt: now
        };

        console.log(
            `✅ Fresh token cached for ${(TOKEN_CACHE_DURATION / 60000).toString()} minutes`
        );
        logTokenMetrics();

        return token;
    } catch (error) {
        console.warn('❌ Failed to get access token from Privy:', error);
        return null;
    }
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
