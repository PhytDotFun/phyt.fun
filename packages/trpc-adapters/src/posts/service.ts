import type { Post, InsertPost } from '@phyt/data-access/models/posts';
import { PostSchema } from '@phyt/data-access/models/posts';
import type { Redis } from 'ioredis';
import type { IdEncoder } from '@phyt/core/contracts';

import type { UserService } from '../users/service';
import type { RunService } from '../runs/service';

import type { PostRepository } from './repository';

interface PostServiceDeps {
    postRepository: PostRepository;
    userService: UserService;
    runService: RunService;
    redis: Redis;
    idEncoder: IdEncoder;
}

export class PostService {
    private repo: PostRepository;
    private userService: UserService;
    private runService: RunService;
    private redis: Redis;
    private idEncoder: IdEncoder;

    private readonly POST_CACHE_TTL = 10 * 60; // 10 minutes

    constructor(deps: PostServiceDeps) {
        this.repo = deps.postRepository;
        this.userService = deps.userService;
        this.runService = deps.runService;
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
        if (typeof transformed.startTime === 'string') {
            transformed.startTime = new Date(transformed.startTime);
        }

        // Transform nested objects
        if (transformed.user && typeof transformed.user === 'object') {
            transformed.user = this.transformCachedData(transformed.user);
        }
        if (transformed.run && typeof transformed.run === 'object') {
            transformed.run = this.transformCachedData(transformed.run);
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

        // Cache miss - fetch from database and enrich
        try {
            const post = await this.repo.findByPostId(id);

            if (!post) throw new Error('Could not find post');

            const user = await this.userService.getUserById(post.userId);
            const run = await this.runService.getRunById(post.runId);

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
                    '[cache] Redis SET error for key',
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
            const user = await this.userService.getUserById(newPost.userId);
            const run = await this.runService.getRunById(newPost.runId);

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

    async getFeed(limit: number = 50): Promise<Post[]> {
        const cacheKey = this.getCacheKey('feed', 'recent', limit.toString());

        // Try cache first
        try {
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                const parsedJson: unknown = JSON.parse(cached);
                const transformedData = this.transformCachedData(parsedJson);
                if (Array.isArray(transformedData)) {
                    const posts = transformedData
                        .map((item) => {
                            const parsed = PostSchema.safeParse(item);
                            if (parsed.success) {
                                return parsed.data;
                            }
                            return null;
                        })
                        .filter((post): post is Post => post !== null);

                    if (posts.length > 0) {
                        return posts;
                    }
                }
                // Invalid cached data - delete it
                await this.redis.del(cacheKey);
            }
        } catch (error) {
            console.error(
                '[cache] Redis GET error for key',
                cacheKey,
                ':',
                error
            );
        }

        // Cache miss - fetch from database and enrich
        try {
            const posts = await this.repo.findBatchPosts(limit);

            if (posts.length === 0) {
                return [];
            }

            // Enrich posts with user and run data
            const enrichedPosts: Post[] = [];

            for (const post of posts) {
                try {
                    const [user, run] = await Promise.all([
                        this.userService.getUserById(post.userId),
                        this.runService.getRunById(post.runId)
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

            // Cache the enriched feed
            try {
                await this.redis.set(
                    cacheKey,
                    JSON.stringify(enrichedPosts),
                    'EX',
                    300 // 5 minutes cache for feed
                );
            } catch (error) {
                console.error(
                    '[cache] Redis SET error for key',
                    cacheKey,
                    ':',
                    error
                );
            }

            return enrichedPosts;
        } catch (error) {
            console.error('Error fetching feed:', error);
            return [];
        }
    }
}
