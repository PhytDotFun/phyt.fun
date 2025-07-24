import type { Cache } from '@phyt/core/contracts';

export class IdempotencyManager {
    constructor(
        private readonly cache: Cache,
        private readonly ttlSeconds: number = 86_400
    ) {
        if (ttlSeconds <= 0) throw new Error('TTL must be positive');
    }

    private makeKey(id: string, event: string): string {
        return `webhook:${id}:${event}`;
    }

    async checkAndMark(
        id: string,
        event: string,
        data?: unknown
    ): Promise<{ isDuplicate: boolean; key: string }> {
        const key = this.makeKey(id, event);
        const already = await this.cache.get<boolean>(key);

        if (!already) {
            await this.cache.set(key, data ?? true, this.ttlSeconds);
        }
        return { isDuplicate: Boolean(already), key };
    }

    delete(key: string): Promise<void> {
        return this.cache.delete(key);
    }
}
