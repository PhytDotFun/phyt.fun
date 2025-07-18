import type { Dependencies as Deps } from '@phyt/core/di';
import type { NewUser, User } from '@phyt/data-access/models/users';
import { UserSchema } from '@phyt/data-access/models/users';

import { UserRepository } from './repository';

export class UserService {
    private repo: UserRepository;
    private deps: Deps;

    // Cache TTL in seconds (15 minutes)
    private readonly USER_CACHE_TTL = 15 * 60;

    constructor(deps: Deps) {
        this.deps = deps;
        this.repo = new UserRepository(deps.db);
    }

    // Generate cache keys for different lookup types
    private getCacheKey(type: 'privy' | 'wallet', identifier: string): string {
        return `user:${type}:${identifier}`;
    }

    async syncPrivyData(data: NewUser): Promise<User> {
        const user = await this.repo.upsertByPrivyId(data);

        // Invalidate all cache entries for this user after sync
        await this.invalidateUserCache(user);

        return user;
    }

    // Helper function to transform cached data (convert date strings back to Date objects)
    private transformCachedUser(cachedData: unknown): unknown {
        if (!cachedData || typeof cachedData !== 'object') {
            return cachedData;
        }

        // Type guard and transformation for cached user data
        const data = cachedData as Record<string, unknown>;
        const transformed = { ...data };

        // Convert date strings back to Date objects
        if (typeof transformed.createdAt === 'string') {
            transformed.createdAt = new Date(transformed.createdAt);
        }
        if (typeof transformed.updatedAt === 'string') {
            transformed.updatedAt = new Date(transformed.updatedAt);
        }
        if (typeof transformed.deletedAt === 'string') {
            transformed.deletedAt = new Date(transformed.deletedAt);
        }

        return transformed;
    }

    async getUserByPrivyDID(privyDID: string): Promise<User | null> {
        const cacheKey = this.getCacheKey('privy', privyDID);

        // Try to get from cache first
        try {
            const cached = await this.deps.redis.get(cacheKey);

            if (cached) {
                const parsedJson: unknown = JSON.parse(cached);
                const transformedData = this.transformCachedUser(parsedJson);
                const parsed = UserSchema.nullable().safeParse(transformedData);

                if (parsed.success) {
                    return parsed.data;
                } else {
                    console.log(
                        '[cache] Schema validation failed:',
                        parsed.error.issues
                    );
                    await this.deps.redis.del(cacheKey);
                }
            }
        } catch (error) {
            console.error(
                '[cache] Redis GET error for key',
                cacheKey,
                ':',
                error
            );
        }

        // Cache miss - fetch from database
        const user = await this.repo.findByPrivyDID(privyDID);

        // Cache the result
        if (user) {
            try {
                const serialized = JSON.stringify(user);
                await this.deps.redis.set(
                    cacheKey,
                    serialized,
                    'EX',
                    this.USER_CACHE_TTL
                );
            } catch (error) {
                console.error(
                    '[cache] Redis SET error for key',
                    cacheKey,
                    ':',
                    error
                );
            }
        }

        return user;
    }

    async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
        const cacheKey = this.getCacheKey('wallet', walletAddress);

        // Try to get from cache first
        const cached = await this.deps.redis.get(cacheKey);
        if (cached) {
            const parsedJson: unknown = JSON.parse(cached);
            const transformedData = this.transformCachedUser(parsedJson);
            const parsed = UserSchema.nullable().safeParse(transformedData);
            if (parsed.success) {
                return parsed.data;
            }
            // Invalid cached data - delete it
            await this.deps.redis.del(cacheKey);
        }

        // Cache miss - fetch from database
        const user = await this.repo.findByWalletAddress(walletAddress);

        // Cache the result
        if (user) {
            await this.deps.redis.set(
                cacheKey,
                JSON.stringify(user),
                'EX',
                this.USER_CACHE_TTL
            );
        }

        return user;
    }

    // Helper method to invalidate all cache entries for a user
    private async invalidateUserCache(user: User): Promise<void> {
        const promises: Promise<number>[] = [];

        // Clear cache by Privy DID
        promises.push(
            this.deps.redis.del(this.getCacheKey('privy', user.privyDID))
        );

        // Clear cache by wallet address if present
        if (user.walletAddress) {
            promises.push(
                this.deps.redis.del(
                    this.getCacheKey('wallet', user.walletAddress)
                )
            );
        }

        await Promise.all(promises);
        console.log('[cache] Invalidated cache for user:', user.privyDID);
    }

    // Public method to manually clear user cache (useful for admin operations)
    async clearUserCache(privyDID: string): Promise<void> {
        // For simplicity, just clear the main cache entry
        const deletedCount = await this.deps.redis.del(
            this.getCacheKey('privy', privyDID)
        );
        console.log(
            '[cache] Cleared',
            deletedCount.toString(),
            'cache entries for user:',
            privyDID
        );
    }
}
