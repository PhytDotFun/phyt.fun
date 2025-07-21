import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { z } from 'zod';
import {
    createInsertSchema,
    createSelectSchema,
    createUpdateSchema
} from 'drizzle-zod';

import { posts } from '../db/schema';

import { UserSchema } from './users';

// Repo Schemas

export const InsertPostSchema = createInsertSchema(posts);
export const SelectPostSchema = createSelectSchema(posts);
export const UpdatePostSchema = createUpdateSchema(posts);

export type InsertPost = InferInsertModel<typeof posts>;
export type SelectPost = InferSelectModel<typeof posts>;

// Service Schemas

// export const UpdatePostSchema = z
//     .object({
//         id: z.number(),
//         content: z.string().max(2000).optional(),
//         visibility: z.enum(['public', 'hidden']).optional()
//     })
//     .refine(
//         (data) => data.content !== undefined || data.visibility !== undefined
//     );

export const CreatePostSchema = z.object({
    runId: z.string().min(1),
    content: z.string().max(2000).optional(),
    visibility: z.enum(['public', 'hidden']).default('public')
});

// Procedures Schemas

export const PostSchema = z.object({
    id: z.number(),
    userId: z.number(),
    runId: z.number(),
    content: z.string().nullable(),
    visibility: z.enum(['public', 'hidden']),
    isProfile: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
    user: UserSchema,
    run: z.object({
        id: z.number(),
        distance: z.number(),
        duration: z.number(),
        startTime: z.date()
    })
});

export type Post = z.infer<typeof PostSchema>;
