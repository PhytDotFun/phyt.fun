import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { z } from 'zod';
import {
    createInsertSchema,
    createSelectSchema,
    createUpdateSchema
} from 'drizzle-zod';

import { posts } from '../db/schema';

import { UserSchema } from './users';
import { RunPostSchema } from './runs';

export const InsertPostSchema = createInsertSchema(posts);
export const SelectPostSchema = createSelectSchema(posts);
export const UpdatePostSchema = createUpdateSchema(posts);

export type InsertPost = InferInsertModel<typeof posts>;
export type SelectPost = InferSelectModel<typeof posts>;

export const PostSchema = z.object({
    id: z.string(), // public id
    content: z.string().nullable(),
    visibility: z.enum(['public', 'hidden']),
    user: UserSchema,
    run: RunPostSchema
});

export type Post = z.infer<typeof PostSchema>;

export const FeedPostsSchema = z.array(PostSchema);

export type Feed = z.infer<typeof FeedPostsSchema>;
