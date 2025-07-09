import { z } from 'zod';
import { getUserSchema, getMultipleUsersSchema } from '../validation/users';

export type GetUser = z.infer<typeof getUserSchema>;

export type GetMultipleUsers = z.infer<typeof getMultipleUsersSchema>;
