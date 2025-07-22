import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { z } from 'zod';
import {
    createInsertSchema,
    createSelectSchema,
    createUpdateSchema
} from 'drizzle-zod';

import { runs } from '../db/schema';

export const InsertRunSchema = createInsertSchema(runs);
export const SelectRunSchema = createSelectSchema(runs);
export const UpdateRunSchema = createUpdateSchema(runs);

export type SelectRun = InferSelectModel<typeof runs>;
export type InsertRun = InferInsertModel<typeof runs>;

export const MarkRunPostedSchema = z.object({
    id: z.string(),
    isPosted: z.boolean(),
    toPost: z.literal(false)
});

export type MarkRun = z.infer<typeof MarkRunPostedSchema>;

export const RunPostSchema = z.object({
    id: z.string(),
    startTime: z.date(),
    endTime: z.date(),
    duration: z.number(),
    distance: z.number(),
    averageSpeed: z.number().nullable(),
    averagePace: z.number().nullable(),
    averageHeartRate: z.number(),
    maxHeartRate: z.number(),
    isIndoor: z.boolean().nullable(),
    toPost: z.boolean(),
    isPosted: z.boolean()
});

export type Run = z.infer<typeof RunPostSchema>;
