import type {
    Post,
    InsertPost,
    PaginatedFeed
} from '@phyt/data-access/models/posts';
import {
    PostSchema,
    PaginatedFeedSchema
} from '@phyt/data-access/models/posts';
import type { Redis } from 'ioredis';
import type { IdEncoder } from '@phyt/core/contracts';

import type { UsersService } from '../users/service';
import type { RunsService } from '../runs/service';

import type { PostsRepository } from './repository';

interface PostsServiceDeps {
    postsRepository: PostsRepository;
    usersService: UsersService;
    runsService: RunsService;
    redis: Redis;
    idEncoder: IdEncoder;
}

export class PostsService {
    private repo: PostsRepository;
    private usersService: UsersService;
    private runsService: RunsService;
    private redis: Redis;
    private idEncoder: IdEncoder;

    private readonly POST_CACHE_TTL = 10 * 60; // 10 minutes

    constructor(deps: PostsServiceDeps) {
        this.repo = deps.postsRepository;
        this.usersService = deps.usersService;
        this.runsService = deps.runsService;
        this.redis = deps.redis;
        this.idEncoder = deps.idEncoder;
    }

    // Generate cache keys
    private getCacheKey(
        type: string,
        identifier: string,
        ...params: string[]
    ): string {
        const parts = ['post', type, identifier, ...params].filter(Boolean);
        return parts.join(':');
    }

    private transformCachedData(cachedData: unknown): unknown {
        if (!cachedData || typeof cachedData !== 'object') {
            return cachedData;
        }

        if (Array.isArray(cachedData)) {
            return cachedData.map((item) => this.transformCachedData(item));
        }

        const data = cachedData as Record<string, unknown>;
        const transformed = { ...data };

        if (typeof transformed.createdAt === 'string') {
            transformed.createdAt = new Date(transformed.createdAt);
        }
        if (typeof transformed.updatedAt === 'string') {
            transformed.updatedAt = new Date(transformed.updatedAt);
        }
        if (typeof transformed.deletedAt === 'string') {
            transformed.deletedAt = new Date(transformed.deletedAt);
        }

        if (transformed.user && typeof transformed.user === 'object') {
            transformed.user = this.transformCachedData(transformed.user);
        }

        if (transformed.run && typeof transformed.run === 'object') {
            const runData = transformed.run as Record<string, unknown>;
            const transformedRun = { ...runData };

            if (typeof transformedRun.startTime === 'string') {
                transformedRun.startTime = new Date(transformedRun.startTime);
            }
            if (typeof transformedRun.endTime === 'string') {
                transformedRun.endTime = new Date(transformedRun.endTime);
            }
            transformed.run = transformedRun;
        }

        return transformed;
    }

    async getPostByPublicId(publicId: string): Promise<Post | null> {
        try {
            const id = this.idEncoder.decode('posts', publicId);
            if (!id) throw new Error('Failed to find post id');

            return await this.getPostById(id);
        } catch (error) {
            console.error('Error fetching post by id: ', error);
            return null;
        }
    }

    async getPostById(id: number): Promise<Post | null> {
        const cacheKey = this.getCacheKey('id', id.toString());

        // Try cache first
        try {
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                const parsedJson: unknown = JSON.parse(cached);
                const transformedData = this.transformCachedData(parsedJson);
                const parsed = PostSchema.nullable().safeParse(transformedData);
                if (parsed.success) {
                    return parsed.data;
                } else {
                    console.log(
                        '[CACHE] Schema validation failed:',
                        parsed.error.issues
                    );
                    await this.redis.del(cacheKey);
                }
            }
        } catch (error) {
            console.error(
                '[CACHE] Redis GET error for key',
                cacheKey,
                ':',
                error
            );
        }

        // Cache miss - fetch from database and enrich
        try {
            const post = await this.repo.findByPostId(id);

            if (!post) throw new Error('Could not find post');

            const user = await this.usersService.getUserById(post.userId);
            const run = await this.runsService.getRunById(post.runId);

            if (!user) throw new Error('Could not find post author');
            if (!run) throw new Error('Could not find post run');

            // Create the enriched Post object
            const returnedPost = {
                id: this.idEncoder.encode('posts', post.id),
                content: post.content,
                visibility: post.visibility,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                user: user,
                run: run
            };

            PostSchema.parse(returnedPost);

            // Cache the enriched Post object
            try {
                await this.redis.set(
                    cacheKey,
                    JSON.stringify(returnedPost),
                    'EX',
                    this.POST_CACHE_TTL
                );
            } catch (error) {
                console.error(
                    '[CACHE] Redis SET error for key',
                    cacheKey,
                    ':',
                    error
                );
            }

            return returnedPost;
        } catch (error) {
            console.error('Error fetching post by id: ', error);
            return null;
        }
    }

    async createPost(data: InsertPost): Promise<Post> {
        try {
            // Insert the post into the database
            const newPost = await this.repo.insert(data);

            // Get the user and run data to return the full Post object
            const user = await this.usersService.getUserById(newPost.userId);
            const run = await this.runsService.getRunById(newPost.runId);

            if (!user) {
                throw new Error('Could not find post author');
            }

            if (!run) {
                throw new Error('Could not find post run');
            }

            const returnedPost = {
                id: this.idEncoder.encode('posts', newPost.id),
                content: newPost.content,
                visibility: newPost.visibility,
                user: user,
                run: run
            };

            PostSchema.parse(returnedPost);

            return returnedPost;
        } catch (error) {
            console.error('Error creating post: ', error);
            throw error;
        }
    }

    async getFeed(
        limit: number = 20,
        cursor?: string // ISO string of createdAt timestamp
    ): Promise<PaginatedFeed> {
        // Parse cursor if provided
        const cursorDate = cursor ? new Date(cursor) : undefined;

        const cacheKey = this.getCacheKey(
            'feed',
            'recent',
            limit.toString(),
            cursor || 'initial'
        );

        // Try cache first
        try {
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                const parsedJson: unknown = JSON.parse(cached);
                const transformedData = this.transformCachedData(parsedJson);
                const parsed = PaginatedFeedSchema.safeParse(transformedData);
                if (parsed.success) {
                    return parsed.data;
                }
                // Invalid cached data - delete it
                await this.redis.del(cacheKey);
            }
        } catch (error) {
            console.error(
                '[CACHE] Redis GET error for key',
                cacheKey,
                ':',
                error
            );
        }

        // Cache miss - fetch from database and enrich
        try {
            const posts = await this.repo.findBatchPosts(limit, cursorDate);

            if (posts.length === 0) {
                return {
                    posts: [],
                    nextCursor: null,
                    hasMore: false
                };
            }

            // Enrich posts with user and run data
            const enrichedPosts: Post[] = [];

            for (const post of posts) {
                try {
                    const [user, run] = await Promise.all([
                        this.usersService.getUserById(post.userId),
                        this.runsService.getRunById(post.runId)
                    ]);

                    if (!user) {
                        console.warn(
                            `User not found for post ${post.id.toString()}`
                        );
                        continue;
                    }

                    if (!run) {
                        console.warn(
                            `Run not found for post ${post.id.toString()}`
                        );
                        continue;
                    }

                    const enrichedPost: Post = {
                        id: this.idEncoder.encode('posts', post.id),
                        content: post.content,
                        visibility: post.visibility,
                        user: user,
                        run: run
                    };

                    PostSchema.parse(enrichedPost);
                    enrichedPosts.push(enrichedPost);
                } catch (error) {
                    console.error(
                        `Error enriching post ${post.id.toString()}:`,
                        error
                    );
                    // Continue processing other posts
                }
            }

            // Determine if there are more posts and create next cursor
            const hasMore = posts.length === limit;
            const nextCursor =
                hasMore && posts.length > 0
                    ? posts[posts.length - 1]?.createdAt.toISOString() || null
                    : null;

            const paginatedFeed: PaginatedFeed = {
                posts: enrichedPosts,
                nextCursor,
                hasMore
            };

            // Validate the response
            PaginatedFeedSchema.parse(paginatedFeed);

            // Cache the paginated feed
            try {
                await this.redis.set(
                    cacheKey,
                    JSON.stringify(paginatedFeed),
                    'EX',
                    120 // 2 minutes cache for feed pages (shorter for fresher content)
                );
            } catch (error) {
                console.error(
                    '[CACHE] Redis SET error for key',
                    cacheKey,
                    ':',
                    error
                );
            }

            return paginatedFeed;
        } catch (error) {
            console.error('Error fetching feed:', error);
            return {
                posts: [],
                nextCursor: null,
                hasMore: false
            };
        }
    }

    async getProfilePosts(
        userIdentifier: { privyDID: string } | { walletAddress: string },
        limit: number = 20,
        cursor?: string // ISO string of createdAt timestamp
    ): Promise<PaginatedFeed> {
        // Determine cache key and identifier type
        const isPrivyDID = 'privyDID' in userIdentifier;
        const identifierValue = isPrivyDID
            ? userIdentifier.privyDID
            : userIdentifier.walletAddress;
        const identifierType = isPrivyDID ? 'privyDID' : 'walletAddress';

        // Parse cursor if provided
        const cursorDate = cursor ? new Date(cursor) : undefined;

        const cacheKey = this.getCacheKey(
            'profile',
            identifierType,
            identifierValue,
            limit.toString(),
            cursor || 'initial'
        );

        // Try cache first
        try {
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                const parsedJson: unknown = JSON.parse(cached);
                const transformedData = this.transformCachedData(parsedJson);
                const parsed = PaginatedFeedSchema.safeParse(transformedData);
                if (parsed.success) {
                    return parsed.data;
                }
                // Invalid cached data - delete it
                await this.redis.del(cacheKey);
            }
        } catch (error) {
            console.error(
                '[CACHE] Redis GET error for key',
                cacheKey,
                ':',
                error
            );
        }

        // Cache miss - fetch from database and enrich
        try {
            // Use appropriate repository method based on identifier type
            const posts = isPrivyDID
                ? await this.repo.findPrivyDIDBatchPosts(
                      identifierValue,
                      limit,
                      cursorDate
                  )
                : await this.repo.findWalletAddressBatchPosts(
                      identifierValue,
                      limit,
                      cursorDate
                  );

            if (posts.length === 0) {
                return {
                    posts: [],
                    nextCursor: null,
                    hasMore: false
                };
            }

            // Enrich posts with user and run data
            const enrichedPosts: Post[] = [];

            for (const post of posts) {
                try {
                    const [user, run] = await Promise.all([
                        this.usersService.getUserById(post.userId),
                        this.runsService.getRunById(post.runId)
                    ]);

                    if (!user) {
                        console.warn(
                            `User not found for post ${post.id.toString()}`
                        );
                        continue;
                    }

                    if (!run) {
                        console.warn(
                            `Run not found for post ${post.id.toString()}`
                        );
                        continue;
                    }

                    const enrichedPost: Post = {
                        id: this.idEncoder.encode('posts', post.id),
                        content: post.content,
                        visibility: post.visibility,
                        user: user,
                        run: run
                    };

                    PostSchema.parse(enrichedPost);
                    enrichedPosts.push(enrichedPost);
                } catch (error) {
                    console.error(
                        `Error enriching post ${post.id.toString()}:`,
                        error
                    );
                    // Continue processing other posts
                }
            }

            // Determine if there are more posts and create next cursor
            const hasMore = posts.length === limit;
            const nextCursor =
                hasMore && posts.length > 0
                    ? posts[posts.length - 1]?.createdAt.toISOString() || null
                    : null;

            const paginatedFeed: PaginatedFeed = {
                posts: enrichedPosts,
                nextCursor,
                hasMore
            };

            // Validate the response
            PaginatedFeedSchema.parse(paginatedFeed);

            // Cache the enriched profile posts
            try {
                await this.redis.set(
                    cacheKey,
                    JSON.stringify(paginatedFeed),
                    'EX',
                    600 // 10 minutes cache for profile posts (longer than feed)
                );
            } catch (error) {
                console.error(
                    '[CACHE] Redis SET error for key',
                    cacheKey,
                    ':',
                    error
                );
            }

            return paginatedFeed;
        } catch (error) {
            console.error(
                `Error fetching profile posts for ${identifierType} ${identifierValue}:`,
                error
            );
            return {
                posts: [],
                nextCursor: null,
                hasMore: false
            };
        }
    }
}
