import type {
    InsertUser,
    SelectUser,
    User
} from '@phyt/data-access/models/users';
import { SelectUserSchema, UserSchema } from '@phyt/data-access/models/users';
import type { Redis } from 'ioredis';

import type { UserRepository } from './repository';

interface UserServiceDeps {
    userRepository: UserRepository;
    redis: Redis;
}

export class UserService {
    private repo: UserRepository;
    private redis: Redis;

    private readonly USER_CACHE_TTL = 15 * 60; // 15 minutes

    constructor(deps: UserServiceDeps) {
        this.repo = deps.userRepository;
        this.redis = deps.redis;
    }

    // Generate cache keys for different lookup types
    private getCacheKey(type: string, identifier: string): string {
        return `user:${type}:${identifier}`;
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

    async syncPrivyData(data: InsertUser): Promise<SelectUser> {
        const user = await this.repo.upsertByPrivyId(data);

        // Invalidate all cache entries for this user after sync
        await this.invalidateUserCache(user);

        return user;
    }

    async getUserById(id: number): Promise<User | null> {
        const cacheKey = this.getCacheKey('id', id.toString());

        try {
            const cached = await this.redis.get(cacheKey);

            if (cached) {
                const parsedJson: unknown = JSON.parse(cached);
                const transformedData = this.transformCachedUser(parsedJson);
                const parsed =
                    SelectUserSchema.nullable().safeParse(transformedData);

                if (parsed.success) {
                    return parsed.data;
                } else {
                    console.log(
                        '[cache] Schema validation failed:',
                        parsed.error.issues
                    );
                    await this.redis.del(cacheKey);
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
        try {
            const user = await this.repo.findByUserId(id);

            if (!user) throw new Error('Could not find user in Cache or DB');

            // Cache the result
            try {
                const serialized = JSON.stringify(user);
                await this.redis.set(
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

            const returnedUser = {
                username: user.username,
                role: user.role,
                profilePictureUrl: user.profilePictureUrl,
                walletAddress: user.walletAddress
            };

            UserSchema.parse(returnedUser);

            return returnedUser;
        } catch (error) {
            console.error('Error fetching user by id', error);
            return null;
        }
    }

    async getUserByPrivyDID(privyDID: string): Promise<User | null> {
        const cacheKey = this.getCacheKey('privy', privyDID);

        // Try cache first
        try {
            const cached = await this.redis.get(cacheKey);

            if (cached) {
                const parsedJson: unknown = JSON.parse(cached);
                const transformedData = this.transformCachedUser(parsedJson);
                const parsed =
                    SelectUserSchema.nullable().safeParse(transformedData);

                if (parsed.success) {
                    return parsed.data;
                } else {
                    console.log(
                        '[cache] Schema validation failed:',
                        parsed.error.issues
                    );
                    await this.redis.del(cacheKey);
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
        try {
            const user = await this.repo.findByPrivyDID(privyDID);

            if (!user) throw new Error('Could not find user in Cache or DB');

            // Cache the result
            try {
                const serialized = JSON.stringify(user);
                await this.redis.set(
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

            const returnedUser = {
                username: user.username,
                role: user.role,
                profilePictureUrl: user.profilePictureUrl,
                walletAddress: user.walletAddress
            };

            UserSchema.parse(returnedUser);

            return returnedUser;
        } catch (error) {
            console.error('Error fetching user by privyDID', error);
            return null;
        }
    }

    async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
        const cacheKey = this.getCacheKey('wallet', walletAddress);

        try {
            // Try to get from cache first
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                const parsedJson: unknown = JSON.parse(cached);
                const transformedData = this.transformCachedUser(parsedJson);
                const parsed =
                    SelectUserSchema.nullable().safeParse(transformedData);
                if (parsed.success) {
                    return parsed.data;
                }
                // Invalid cached data - delete it
                await this.redis.del(cacheKey);
            }

            // Cache miss - fetch from database
            const user = await this.repo.findByWalletAddress(walletAddress);

            if (!user) throw new Error();

            // Cache the result
            await this.redis.set(
                cacheKey,
                JSON.stringify(user),
                'EX',
                this.USER_CACHE_TTL
            );

            const returnedUser = {
                username: user.username,
                role: user.role,
                profilePictureUrl: user.profilePictureUrl,
                walletAddress: user.walletAddress
            };

            UserSchema.parse(returnedUser);

            return returnedUser;
        } catch (error) {
            console.error('Error fetching user by wallet address', error);
            return null;
        }
    }

    // Helper method to invalidate all cache entries for a user
    private async invalidateUserCache(user: SelectUser): Promise<void> {
        const promises: Promise<number>[] = [];

        // Clear cache by Privy DID
        promises.push(this.redis.del(this.getCacheKey('privy', user.privyDID)));

        // Clear cache by wallet address if present
        if (user.walletAddress) {
            promises.push(
                this.redis.del(this.getCacheKey('wallet', user.walletAddress))
            );
        }

        await Promise.all(promises);
        console.log('[cache] Invalidated cache for user:', user.privyDID);
    }

    // Public method to manually clear user cache (useful for admin operations)
    async clearUserCache(privyDID: string): Promise<void> {
        // For simplicity, just clear the main cache entry
        const deletedCount = await this.redis.del(
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
