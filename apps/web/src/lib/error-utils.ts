import { TRPCClientError } from '@trpc/client';

export interface RetryConfig {
    shouldRetry: boolean;
    maxRetries: number;
}

/**
 * Checks if a TRPC error is a user sync error (user hasn't been synced from Privy yet)
 */
export function isUserSyncError(error: unknown): boolean {
    if (!(error instanceof TRPCClientError)) {
        return false;
    }

    const errorData = error.data as {
        code?: string;
        message?: string;
    } | null;

    return (
        errorData !== null &&
        errorData.code === 'INTERNAL_SERVER_ERROR' &&
        errorData.message === 'Error fetching user'
    );
}

/**
 * Determines if we should show a loading state instead of throwing error for user sync issues
 */
export function shouldShowLoadingForError(error: unknown): boolean {
    return isUserSyncError(error);
}

/**
 * Determines retry configuration based on error type
 */
export function getRetryConfig(
    failureCount: number,
    error: unknown
): RetryConfig {
    if (isUserSyncError(error)) {
        return {
            shouldRetry: failureCount < 10,
            maxRetries: 10
        };
    }

    // Default retry behavior for other errors
    return {
        shouldRetry: failureCount < 3,
        maxRetries: 3
    };
}

/**
 * Calculates retry delay with exponential backoff
 */
export function getRetryDelay(attemptIndex: number): number {
    // Exponential backoff starting at 1s: 1s, 2s, 4s, 8s, etc. up to 30s max
    return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
}
