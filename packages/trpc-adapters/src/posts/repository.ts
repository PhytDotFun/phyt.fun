import { eq, and, isNull, desc, lt } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { posts, users } from '@phyt/data-access/db/schema';
import type { SelectPost, InsertPost } from '@phyt/data-access/models/posts';
import {
    SelectPostSchema,
    InsertPostSchema,
    UpdatePostSchema
} from '@phyt/data-access/models/posts';

import type { UsersRepository } from '../users/repository';

interface PostsRepositoryDeps {
    db: NodePgDatabase;
    usersRepository: UsersRepository;
}

export class PostsRepository {
    private db: NodePgDatabase;
    private usersRepository: UsersRepository;

    constructor(deps: PostsRepositoryDeps) {
        this.db = deps.db;
        this.usersRepository = deps.usersRepository;
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
            await this.usersRepository.findByWalletAddress(walletAddress);

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

    async findBatchPosts(
        limit: number = 20,
        cursor?: Date
    ): Promise<SelectPost[]> {
        const conditions = [
            eq(posts.visibility, 'public'),
            eq(posts.isProfile, false),
            isNull(posts.deletedAt)
        ];

        // Add cursor condition for pagination
        if (cursor) {
            conditions.push(lt(posts.createdAt, cursor));
        }

        const batchPosts = await this.db
            .select()
            .from(posts)
            .where(and(...conditions))
            .orderBy(desc(posts.createdAt))
            .limit(limit);

        return batchPosts.map((post) => {
            SelectPostSchema.parse(post);
            return post;
        });
    }

    async findPrivyDIDBatchPosts(
        privyDID: string,
        limit: number = 20,
        cursor?: Date
    ): Promise<SelectPost[]> {
        const conditions = [
            eq(users.privyDID, privyDID),
            eq(posts.visibility, 'public'),
            eq(posts.isProfile, false),
            isNull(posts.deletedAt),
            isNull(users.deletedAt)
        ];

        // Add cursor condition for pagination
        if (cursor) {
            conditions.push(lt(posts.createdAt, cursor));
        }

        const batchPosts = await this.db
            .select({
                id: posts.id,
                userId: posts.userId,
                runId: posts.runId,
                content: posts.content,
                visibility: posts.visibility,
                isProfile: posts.isProfile,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                deletedAt: posts.deletedAt
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(and(...conditions))
            .orderBy(desc(posts.createdAt))
            .limit(limit);

        return batchPosts.map((post) => {
            SelectPostSchema.parse(post);
            return post;
        });
    }

    async findWalletAddressBatchPosts(
        walletAddress: string,
        limit: number = 20,
        cursor?: Date
    ): Promise<SelectPost[]> {
        const conditions = [
            eq(users.walletAddress, walletAddress),
            eq(posts.visibility, 'public'),
            eq(posts.isProfile, false),
            isNull(posts.deletedAt),
            isNull(users.deletedAt)
        ];

        // Add cursor condition for pagination
        if (cursor) {
            conditions.push(lt(posts.createdAt, cursor));
        }

        const batchPosts = await this.db
            .select({
                id: posts.id,
                userId: posts.userId,
                runId: posts.runId,
                content: posts.content,
                visibility: posts.visibility,
                isProfile: posts.isProfile,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                deletedAt: posts.deletedAt
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(and(...conditions))
            .orderBy(desc(posts.createdAt))
            .limit(limit);

        return batchPosts.map((post) => {
            SelectPostSchema.parse(post);
            return post;
        });
    }
}
