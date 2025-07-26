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
            shouldRetry: failureCount < 15,
            maxRetries: 15
        };
    }

    // Default retry behavior for other errors
    return {
        shouldRetry: failureCount < 3,
        maxRetries: 3
    };
}

export function getRetryDelay(attemptIndex: number): number {
    // For user sync errors, use a shorter initial delay but still exponential backoff
    // Start at 500ms: 500ms, 1s, 2s, 4s, etc. up to 10s max for faster recovery
    return Math.min(500 * Math.pow(2, attemptIndex), 10000);
}
