import { Queue, QueueOptions, JobsOptions } from 'bullmq';
import type Redis from 'ioredis';
import type { QueueWithContext } from '@phyt/core/contracts';

// Convert a regular Queue to QueueWithContext
export function createQueueWithContext(queue: Queue): QueueWithContext {
    const queueWithContext = queue as QueueWithContext;
    queueWithContext.addJobWithContext = async (
        name: string,
        data: unknown,
        opts?: JobsOptions
    ): Promise<string | number> => {
        const job = await queue.add(name, data, opts);
        return job.id ?? Date.now().toString();
    };
    return queueWithContext;
}

export interface QueueRegistry {
    createQueue(name: string, opts?: QueueOptions): QueueWithContext;
    getQueue(name: string): QueueWithContext;
    addJobWithContext(
        queue: Queue,
        name: string,
        data: unknown,
        opts?: JobsOptions
    ): Promise<string | number>;
}

export function createQueueRegistry(connection: Redis): QueueRegistry {
    const registry: Map<string, QueueWithContext> = new Map();

    function createQueue(
        name: string,
        opts: Omit<QueueOptions, 'connection'> = {}
    ): QueueWithContext {
        if (registry.has(name))
            throw new Error(`Queue "${name}" already exists – use getQueue().`);
        const baseQueue = new Queue(name, { connection, ...opts });
        const queueWithContext = createQueueWithContext(baseQueue);
        registry.set(name, queueWithContext);
        return queueWithContext;
    }

    function getQueue(name: string): QueueWithContext {
        const q = registry.get(name);
        if (!q) throw new Error(`Queue ${name} has not been created`);
        return q;
    }

    async function addJobWithContext(
        queue: Queue,
        name: string,
        data: unknown,
        opts?: JobsOptions
    ): Promise<string | number> {
        const job = await queue.add(name, data, opts);
        return job.id ?? Date.now().toString();
    }

    return { createQueue, getQueue, addJobWithContext };
}
