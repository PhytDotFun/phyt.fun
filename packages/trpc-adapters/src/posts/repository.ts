// import { eq, and, isNull, desc, sql } from 'drizzle-orm';
// import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
// import { users, posts, runs } from '@phyt/data-access/db/schema';
// import {
//     SelectPostSchema,
//     InsertPostSchema,
//     SelectPost,
//     InsertPost,
//     UpdatePostSchema
// } from '@phyt/data-access/models/posts';

// import type { UserRepository } from '@/users/repository';

// export class PostRepository {
//     constructor(
//         private db: NodePgDatabase,
//         private userRepository: UserRepository
//     ) {}

//     private async first<T>(q: Promise<T[]>): Promise<T | null> {
//         const r = (await q)[0];
//         SelectPostSchema.parse(r);
//         return r ?? null;
//     }

//     async findById(id: number): Promise<SelectPost | null> {
//         return this.first(
//             this.db
//                 .select()
//                 .from(posts)
//                 .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
//                 .limit(1)
//         );
//     }

//     async findByWalletAddress(
//         walletAddress: string
//     ): Promise<SelectPost | null> {
//         const user = await userRepository.findByWalletAddress(walletAddress);
//     }

//     async create(data: unknown): Promise<SelectPost> {
//         const validated: InsertPost = InsertPostSchema.parse(data);
//         const [row] = await this.db.insert(posts).values(validated).returning();
//         return row as SelectPost;
//     }

//     async update(data: unknown): Promise<SelectPost | null> {
//         const validated = UpdatePostSchema.parse(data);

//         if (!validated.id) {
//             throw new Error('Post ID is required for update');
//         }

//         const [updated] = await this.db
//             .update(posts)
//             .set({ ...validated, updatedAt: new Date() })
//             .where(and(eq(posts.id, validated.id), isNull(posts.deletedAt)))
//             .returning();

//         return updated || null;
//     }

//     async delete(id: number): Promise<boolean> {
//         const [deleted] = await this.db
//             .update(posts)
//             .set({ deletedAt: new Date() })
//             .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
//             .returning();

//         return Boolean(deleted);
//     }

//     // async countByUserWalletAddress(walletAddress: string): Promise<number> {
//     //     const userResult = await this.db
//     //         .select({ id: users.id })
//     //         .from(users)
//     //         .where(eq(users.walletAddress, walletAddress))
//     //         .limit(1);

//     //     const user = userResult[0];
//     //     if (!user) return 0;

//     //     const result = await this.db
//     //         .select({ count: sql<number>`count(*)` })
//     //         .from(posts)
//     //         .where(
//     //             and(
//     //                 eq(posts.userId, user.id),
//     //                 isNull(posts.deletedAt),
//     //                 eq(posts.visibility, 'public')
//     //             )
//     //         );

//     //     return result[0]?.count || 0;
//     // }

//     // async exists(publicId: string): Promise<boolean> {
//     //     const internalId = decodePostId(publicId);
//     //     if (!internalId) return false;

//     //     const result = await this.db
//     //         .select({ id: posts.id })
//     //         .from(posts)
//     //         .where(and(eq(posts.id, internalId), isNull(posts.deletedAt)))
//     //         .limit(1);

//     //     return Boolean(result[0]);
//     // }
// }
