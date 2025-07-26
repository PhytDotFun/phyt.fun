import { TRPCClientError } from '@trpc/client';

export interface RetryConfig {
    shouldRetry: boolean;
    maxRetries: number;
}

export function isUserSyncError(error: unknown): boolean {
    if (!(error instanceof TRPCClientError)) {
        return false;
    }

    const errorData = error.data as {
        code?: string;
        message?: string;
    } | null;

    return (
        !!errorData &&
        errorData.code === 'INTERNAL_SERVER_ERROR' &&
        (errorData.message === 'Error fetching user' ||
            errorData.message === 'User sync in progress')
    );
}

export function shouldShowLoadingForError(error: unknown): boolean {
    return isUserSyncError(error);
}

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

export function getRetryDelay(attemptIndex: number): number {
    // Exponential backoff starting at 1s: 1s, 2s, 4s, 8s, etc. up to 30s max
    return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
}
