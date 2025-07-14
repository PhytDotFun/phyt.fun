import { Queue, QueueEvents } from 'bullmq';
import { createBullConnection } from '@phyt/redis/bull';

export enum QueueName {
    AUTH = 'auth',
    BLOCKCHAIN = 'blockchain',
    ANALYTICS = 'analytics'
}

export const defaultJobOptions = {
    attempts: 5,
    backoff: {
        type: 'exponential' as const,
        delay: 2000
    },
    removeOnComplete: {
        age: 3600, // 1 hour
        count: 100
    },
    removeOnFail: {
        age: 86400 // 24 hours
    }
};

export function createQueue<T>(name: QueueName): Queue<T> {
    return new Queue<T>(name, {
        connection: createBullConnection(),
        defaultJobOptions
    });
}

export function createQueueEvents(name: QueueName): QueueEvents {
    return new QueueEvents(name, {
        connection: createBullConnection()
    });
}

export const authQueue = createQueue(QueueName.AUTH);
export const blockchainQueue = createQueue(QueueName.BLOCKCHAIN);
export const analyticsQueue = createQueue(QueueName.ANALYTICS);
