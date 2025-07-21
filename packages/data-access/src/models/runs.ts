import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { runs } from '../db/schema';

// Repos Schemas

export type SelectRun = InferSelectModel<typeof runs>;
export type InsertRun = InferInsertModel<typeof runs>;

export const InsertRunSchema = createInsertSchema(runs);
export const SelectRunSchema = createSelectSchema(runs);

// Service Schemas

export const CreateRunSchema = z.object({
    runId: z.string().min(1),
    content: z.string().max(2000).optional(),
    visibility: z.enum(['public', 'hidden']).default('public')
});

export const UpdateRunSchema = z
    .object({
        id: z.string().min(1),
        content: z.string().max(2000).optional(),
        visibility: z.enum(['public', 'hidden']).optional()
    })
    .refine(
        (data) => data.content !== undefined || data.visibility !== undefined
    );
