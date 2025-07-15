import { Queue, JobsOptions } from 'bullmq';
import { redisBull } from '@phyt/redis/bull';
export type QueueFactory = () => Queue;

const registry: Map<string, Queue> = new Map();

export function createQueue(name: string): Queue {
    if (registry.has(name)) {
        throw new Error(`Queue "${name}" already exists – use getQueue().`);
    }
    const queue: Queue = new Queue(name, { connection: redisBull });
    registry.set(name, queue);
    return queue;
}

export function getQueue(name: string): Queue {
    const q = registry.get(name);
    if (!q) throw new Error(`Queue "${name}" has not been created yet.`);
    return q;
}

const AUTH_QUEUE_NAME = 'auth';
export const authQueue: Queue = createQueue(AUTH_QUEUE_NAME);

export const queueFactory: QueueFactory = () => authQueue;

export async function addJobWithContext(
    queue: Queue,
    name: string,
    data: unknown,
    opts?: JobsOptions
): Promise<string | number> {
    const job = await queue.add(name, data, opts);
    return job.id ?? Date.now().toString();
}
