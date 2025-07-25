import { eq, and, isNull, desc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { posts } from '@phyt/data-access/db/schema';
import type { SelectPost, InsertPost } from '@phyt/data-access/models/posts';
import {
    SelectPostSchema,
    InsertPostSchema,
    UpdatePostSchema
} from '@phyt/data-access/models/posts';

import type { UserRepository } from '../users/repository';

interface PostRepositoryDeps {
    db: NodePgDatabase;
    userRepository: UserRepository;
}

export class PostRepository {
    private db: NodePgDatabase;
    private userRepository: UserRepository;

    constructor(deps: PostRepositoryDeps) {
        this.db = deps.db;
        this.userRepository = deps.userRepository;
    }

    private async first(q: Promise<SelectPost[]>): Promise<SelectPost | null> {
        const r = (await q)[0];
        if (!r) return null;
        SelectPostSchema.parse(r);
        return r;
    }

    async findByPostId(id: number) {
        return this.first(
            this.db
                .select()
                .from(posts)
                .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
                .limit(1)
        );
    }

    async findByWalletAddress(walletAddress: string) {
        const user =
            await this.userRepository.findByWalletAddress(walletAddress);

        if (!user) throw new Error('User not found');

        return this.db
            .select()
            .from(posts)
            .where(
                and(
                    eq(posts.userId, user.id),
                    isNull(posts.deletedAt),
                    eq(posts.visibility, 'public')
                )
            );
    }

    async insert(data: unknown) {
        const validated: InsertPost = InsertPostSchema.parse(data);
        const [row] = await this.db.insert(posts).values(validated).returning();
        return row as SelectPost;
    }

    async update(data: unknown) {
        const validated = UpdatePostSchema.parse(data);

        if (!validated.id) {
            throw new Error('Post ID is required for update');
        }

        const [updated] = await this.db
            .update(posts)
            .set({ ...validated, updatedAt: new Date() })
            .where(and(eq(posts.id, validated.id), isNull(posts.deletedAt)))
            .returning();

        return updated || null;
    }

    async delete(id: number) {
        const [deleted] = await this.db
            .update(posts)
            .set({ deletedAt: new Date() })
            .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
            .returning();

        return deleted || false;
    }

    // async countByUserWalletAddress(walletAddress: string): Promise<number> {
    //     const user =
    //         await this.userRepository.findByWalletAddress(walletAddress);

    //     if (!user) return 0;

    //     const result = await this.db
    //         .select({ count: sql<number>`count(*)` })
    //         .from(posts)
    //         .where(
    //             and(
    //                 eq(posts.userId, user.id),
    //                 isNull(posts.deletedAt),
    //                 eq(posts.visibility, 'public')
    //             )
    //         );

    //     return result[0]?.count || 0;
    // }

    async exists(id: number) {
        const result = await this.db
            .select({ id: posts.id })
            .from(posts)
            .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
            .limit(1);

        return Boolean(result[0]);
    }

    async findBatchPosts(limit: number = 50): Promise<SelectPost[]> {
        const feedPosts = await this.db
            .select()
            .from(posts)
            .where(
                and(
                    eq(posts.visibility, 'public'),
                    eq(posts.isProfile, false),
                    isNull(posts.deletedAt)
                )
            )
            .orderBy(desc(posts.createdAt))
            .limit(limit);

        return feedPosts.map((post) => {
            SelectPostSchema.parse(post);
            return post;
        });
    }
}
