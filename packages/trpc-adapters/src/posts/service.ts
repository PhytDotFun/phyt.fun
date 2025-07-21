// import type { Dependencies as Deps } from '@phyt/core/di';
// import type { CreatePostSchema } from '@phyt/data-access/models/posts';
// import { users, runs } from '@phyt/data-access/db/schema';
// import { eq, and, isNull } from 'drizzle-orm';
// import { z } from 'zod';

// import { decodeRunId, encodePostId } from '../encoder';

// import { PostRepository } from './repository';

// export class PostService {
//     private repo: PostRepository;
//     private deps: Deps;

//     // Cache TTL in seconds
//     private readonly POST_CACHE_TTL = 10 * 60; // 10 minutes
//     private readonly FEED_CACHE_TTL = 5 * 60; // 5 minutes
//     private readonly USER_POSTS_CACHE_TTL = 15 * 60; // 15 minutes

//     constructor(deps: Deps) {
//         this.deps = deps;
//         this.repo = new PostRepository(deps.db);
//     }

//     // Generate cache keys
//     private getCacheKey(
//         type: string,
//         identifier: string,
//         ...params: string[]
//     ): string {
//         const parts = ['post', type, identifier, ...params].filter(Boolean);
//         return parts.join(':');
//     }

//     // Transform cached data (convert date strings back to Date objects)
//     private transformCachedData(cachedData: unknown): unknown {
//         if (!cachedData || typeof cachedData !== 'object') {
//             return cachedData;
//         }

//         if (Array.isArray(cachedData)) {
//             return cachedData.map((item) => this.transformCachedData(item));
//         }

//         const data = cachedData as Record<string, unknown>;
//         const transformed = { ...data };

//         // Convert date strings back to Date objects
//         if (typeof transformed.createdAt === 'string') {
//             transformed.createdAt = new Date(transformed.createdAt);
//         }
//         if (typeof transformed.updatedAt === 'string') {
//             transformed.updatedAt = new Date(transformed.updatedAt);
//         }
//         if (typeof transformed.deletedAt === 'string') {
//             transformed.deletedAt = new Date(transformed.deletedAt);
//         }
//         if (typeof transformed.startTime === 'string') {
//             transformed.startTime = new Date(transformed.startTime);
//         }

//         // Transform nested objects
//         if (transformed.user && typeof transformed.user === 'object') {
//             transformed.user = this.transformCachedData(transformed.user);
//         }
//         if (transformed.run && typeof transformed.run === 'object') {
//             transformed.run = this.transformCachedData(transformed.run);
//         }

//         return transformed;
//     }

//     async createPost(
//         userId: string, // This is the privyDID
//         data: z.infer<typeof CreatePostSchema>
//     ): Promise<PublicPost> {
//         // Get user from database
//         const user = await this.deps.db
//             .select({ id: users.id, walletAddress: users.walletAddress })
//             .from(users)
//             .where(eq(users.privyDID, userId))
//             .limit(1);

//         if (!user[0]) {
//             throw new Error('User not found');
//         }

//         // Validate and decode the run ID
//         const runInternalId = decodeRunId(data.runId);
//         if (!runInternalId) {
//             throw new Error('Invalid run ID');
//         }

//         // Verify the run exists and belongs to the user
//         const run = await this.deps.db
//             .select({ id: runs.id })
//             .from(runs)
//             .where(
//                 and(
//                     eq(runs.id, runInternalId),
//                     eq(runs.userId, user[0].id),
//                     isNull(runs.deletedAt)
//                 )
//             )
//             .limit(1);

//         if (!run[0]) {
//             throw new Error('Run not found or does not belong to user');
//         }

//         // Create the post
//         const newPost: NewPost = {
//             userId: user[0].id,
//             runId: runInternalId,
//             content: data.content || null,
//             visibility: data.visibility,
//             isProfile: false // Default to false, can be changed later
//         };

//         const post = await this.repo.create(newPost);

//         // Invalidate related caches
//         await this.invalidateUserCaches(user[0].walletAddress);
//         await this.invalidateFeedCache();

//         // Return public post
//         return {
//             id: encodePostId(post.id),
//             userWalletAddress: user[0].walletAddress,
//             runId: data.runId,
//             content: post.content,
//             visibility: post.visibility,
//             createdAt: post.createdAt,
//             updatedAt: post.updatedAt,
//             deletedAt: post.deletedAt
//         };
//     }

//     async getPostById(publicId: string): Promise<PublicPost | null> {
//         const cacheKey = this.getCacheKey('id', publicId);

//         // Try cache first
//         try {
//             const cached = await this.deps.redis.get(cacheKey);
//             if (cached) {
//                 const parsedJson: unknown = JSON.parse(cached);
//                 const transformedData = this.transformCachedData(parsedJson);
//                 return transformedData as PublicPost;
//             }
//         } catch (error) {
//             console.error(
//                 '[cache] Redis GET error for key',
//                 cacheKey,
//                 ':',
//                 error
//             );
//         }

//         // Cache miss - fetch from database
//         const post = await this.repo.findByPublicId(publicId);

//         // Cache the result
//         if (post) {
//             try {
//                 await this.deps.redis.set(
//                     cacheKey,
//                     JSON.stringify(post),
//                     'EX',
//                     this.POST_CACHE_TTL
//                 );
//             } catch (error) {
//                 console.error(
//                     '[cache] Redis SET error for key',
//                     cacheKey,
//                     ':',
//                     error
//                 );
//             }
//         }

//         return post;
//     }

//     async getPostWithDetails(
//         publicId: string
//     ): Promise<PostWithDetails | null> {
//         const cacheKey = this.getCacheKey('details', publicId);

//         // Try cache first
//         try {
//             const cached = await this.deps.redis.get(cacheKey);
//             if (cached) {
//                 const parsedJson: unknown = JSON.parse(cached);
//                 const transformedData = this.transformCachedData(parsedJson);
//                 return transformedData as PostWithDetails;
//             }
//         } catch (error) {
//             console.error(
//                 '[cache] Redis GET error for key',
//                 cacheKey,
//                 ':',
//                 error
//             );
//         }

//         // Cache miss - fetch from database
//         const post = await this.repo.findWithDetailsByPublicId(publicId);

//         // Cache the result
//         if (post) {
//             try {
//                 await this.deps.redis.set(
//                     cacheKey,
//                     JSON.stringify(post),
//                     'EX',
//                     this.POST_CACHE_TTL
//                 );
//             } catch (error) {
//                 console.error(
//                     '[cache] Redis SET error for key',
//                     cacheKey,
//                     ':',
//                     error
//                 );
//             }
//         }

//         return post;
//     }

//     async getUserPosts(
//         walletAddress: string,
//         limit: number = 50,
//         offset: number = 0
//     ): Promise<PublicPost[]> {
//         const cacheKey = this.getCacheKey(
//             'user',
//             walletAddress,
//             limit.toString(),
//             offset.toString()
//         );

//         // Try cache first
//         try {
//             const cached = await this.deps.redis.get(cacheKey);
//             if (cached) {
//                 const parsedJson: unknown = JSON.parse(cached);
//                 const transformedData = this.transformCachedData(parsedJson);
//                 return transformedData as PublicPost[];
//             }
//         } catch (error) {
//             console.error(
//                 '[cache] Redis GET error for key',
//                 cacheKey,
//                 ':',
//                 error
//             );
//         }

//         // Cache miss - fetch from database
//         const posts = await this.repo.findByUserWalletAddress(
//             walletAddress,
//             limit,
//             offset
//         );

//         // Cache the result
//         try {
//             await this.deps.redis.set(
//                 cacheKey,
//                 JSON.stringify(posts),
//                 'EX',
//                 this.USER_POSTS_CACHE_TTL
//             );
//         } catch (error) {
//             console.error(
//                 '[cache] Redis SET error for key',
//                 cacheKey,
//                 ':',
//                 error
//             );
//         }

//         return posts;
//     }

//     async getFeedPosts(
//         limit: number = 50,
//         offset: number = 0
//     ): Promise<PostWithDetails[]> {
//         const cacheKey = this.getCacheKey(
//             'feed',
//             limit.toString(),
//             offset.toString()
//         );

//         // Try cache first
//         try {
//             const cached = await this.deps.redis.get(cacheKey);
//             if (cached) {
//                 const parsedJson: unknown = JSON.parse(cached);
//                 const transformedData = this.transformCachedData(parsedJson);
//                 return transformedData as PostWithDetails[];
//             }
//         } catch (error) {
//             console.error(
//                 '[cache] Redis GET error for key',
//                 cacheKey,
//                 ':',
//                 error
//             );
//         }

//         // Cache miss - fetch from database
//         const posts = await this.repo.findFeedPosts(limit, offset);

//         // Cache the result
//         try {
//             await this.deps.redis.set(
//                 cacheKey,
//                 JSON.stringify(posts),
//                 'EX',
//                 this.FEED_CACHE_TTL
//             );
//         } catch (error) {
//             console.error(
//                 '[cache] Redis SET error for key',
//                 cacheKey,
//                 ':',
//                 error
//             );
//         }

//         return posts;
//     }

//     async getProfilePosts(
//         walletAddress: string,
//         limit: number = 50,
//         offset: number = 0
//     ): Promise<PostWithDetails[]> {
//         const cacheKey = this.getCacheKey(
//             'profile',
//             walletAddress,
//             limit.toString(),
//             offset.toString()
//         );

//         // Try cache first
//         try {
//             const cached = await this.deps.redis.get(cacheKey);
//             if (cached) {
//                 const parsedJson: unknown = JSON.parse(cached);
//                 const transformedData = this.transformCachedData(parsedJson);
//                 return transformedData as PostWithDetails[];
//             }
//         } catch (error) {
//             console.error(
//                 '[cache] Redis GET error for key',
//                 cacheKey,
//                 ':',
//                 error
//             );
//         }

//         // Cache miss - fetch from database
//         const posts = await this.repo.findProfilePosts(
//             walletAddress,
//             limit,
//             offset
//         );

//         // Cache the result
//         try {
//             await this.deps.redis.set(
//                 cacheKey,
//                 JSON.stringify(posts),
//                 'EX',
//                 this.USER_POSTS_CACHE_TTL
//             );
//         } catch (error) {
//             console.error(
//                 '[cache] Redis SET error for key',
//                 cacheKey,
//                 ':',
//                 error
//             );
//         }

//         return posts;
//     }

//     async updatePost(
//         userId: string, // privyDID
//         publicId: string,
//         data: { content?: string; visibility?: 'public' | 'hidden' }
//     ): Promise<PublicPost | null> {
//         // Verify ownership
//         const post = await this.repo.findWithDetailsByPublicId(publicId);
//         if (!post) {
//             throw new Error('Post not found');
//         }

//         // Get user to verify ownership
//         const user = await this.deps.db
//             .select({ id: users.id, walletAddress: users.walletAddress })
//             .from(users)
//             .where(eq(users.privyDID, userId))
//             .limit(1);

//         if (!user[0] || user[0].id !== post.userId) {
//             throw new Error('Unauthorized: You can only update your own posts');
//         }

//         // Update the post
//         const updatedPost = await this.repo.update(publicId, data);
//         if (!updatedPost) {
//             return null;
//         }

//         // Invalidate caches
//         await this.invalidatePostCaches(publicId);
//         await this.invalidateUserCaches(user[0].walletAddress);

//         // Return updated public post
//         return {
//             id: publicId,
//             userWalletAddress: user[0].walletAddress,
//             runId: post.run.id.toString(), // This should be encoded
//             content: updatedPost.content,
//             visibility: updatedPost.visibility,
//             createdAt: updatedPost.createdAt,
//             updatedAt: updatedPost.updatedAt,
//             deletedAt: updatedPost.deletedAt
//         };
//     }

//     async deletePost(userId: string, publicId: string): Promise<boolean> {
//         // Verify ownership
//         const post = await this.repo.findWithDetailsByPublicId(publicId);
//         if (!post) {
//             throw new Error('Post not found');
//         }

//         // Get user to verify ownership
//         const user = await this.deps.db
//             .select({ id: users.id, walletAddress: users.walletAddress })
//             .from(users)
//             .where(eq(users.privyDID, userId))
//             .limit(1);

//         if (!user[0] || user[0].id !== post.userId) {
//             throw new Error('Unauthorized: You can only delete your own posts');
//         }

//         // Delete the post
//         const deleted = await this.repo.delete(publicId);

//         if (deleted) {
//             // Invalidate caches
//             await this.invalidatePostCaches(publicId);
//             await this.invalidateUserCaches(user[0].walletAddress);
//             await this.invalidateFeedCache();
//         }

//         return deleted;
//     }

//     // Cache invalidation helpers
//     private async invalidatePostCaches(publicId: string): Promise<void> {
//         const promises: Promise<unknown>[] = [];

//         // Individual post caches
//         promises.push(this.deps.redis.del(this.getCacheKey('id', publicId)));
//         promises.push(
//             this.deps.redis.del(this.getCacheKey('details', publicId))
//         );

//         await Promise.all(promises);
//     }

//     private async invalidateUserCaches(walletAddress: string): Promise<void> {
//         // Use pattern matching to clear all user-related caches
//         const patterns = [
//             `post:user:${walletAddress}:*`,
//             `post:profile:${walletAddress}:*`
//         ];

//         for (const pattern of patterns) {
//             try {
//                 await this.invalidateCachePattern(pattern);
//             } catch (error) {
//                 console.error(
//                     '[cache] Error invalidating pattern',
//                     pattern,
//                     ':',
//                     error
//                 );
//             }
//         }
//     }

//     private async invalidateFeedCache(): Promise<void> {
//         try {
//             await this.invalidateCachePattern('post:feed:*');
//         } catch (error) {
//             console.error('[cache] Error invalidating feed cache:', error);
//         }
//     }

//     private async invalidateCachePattern(pattern: string): Promise<void> {
//         return new Promise((resolve, reject) => {
//             const stream = this.deps.redis.scanStream({
//                 match: pattern,
//                 count: 100
//             });

//             const pipeline = this.deps.redis.pipeline();
//             let count = 0;

//             stream.on('data', (keys: string[]) => {
//                 if (keys.length) {
//                     keys.forEach((key) => pipeline.del(key));
//                     count += keys.length;
//                 }
//             });

//             stream.on('end', () => {
//                 if (count > 0) {
//                     pipeline
//                         .exec()
//                         .then(() => {
//                             console.info(
//                                 `[cache] Invalidated ${String(count)} keys matching ${pattern}`
//                             );
//                             resolve();
//                         })
//                         .catch((error: unknown) => {
//                             console.error(
//                                 '[cache] Error executing pipeline:',
//                                 error
//                             );
//                             reject(
//                                 error instanceof Error
//                                     ? error
//                                     : new Error(String(error))
//                             );
//                         });
//                 } else {
//                     resolve();
//                 }
//             });

//             stream.on('error', (err) => {
//                 console.error('[cache] Error during invalidation:', err);
//                 reject(err);
//             });
//         });
//     }
// }
