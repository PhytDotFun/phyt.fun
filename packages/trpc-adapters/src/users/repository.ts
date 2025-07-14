import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from '@phyt/data-access/db/schema';
import {
    User,
    NewUser,
    InsertUserSchema
} from '@phyt/data-access/models/users';

export class UserRepository {
    constructor(private db: NodePgDatabase) {}

    private async first(q: Promise<User[]>): Promise<User | null> {
        const r = (await q)[0];
        return r ?? null;
    }

    findByPrivyDID(privyDID: string) {
        return this.first(
            this.db
                .select()
                .from(users)
                .where(eq(users.privyDID, privyDID))
                .limit(1)
        );
    }

    async insert(data: unknown) {
        const validated: NewUser = InsertUserSchema.parse(data);
        const [row] = await this.db.insert(users).values(validated).returning();
        return row as User;
    }

    async upsertByPrivyId(data: unknown) {
        // Turns out upsert is a word for an insert/update combo
        const validated: NewUser = InsertUserSchema.parse(data);
        const existing = await this.findByPrivyDID(validated.privyDID);

        if (existing) {
            // Update existing user
            const [updated] = await this.db
                .update(users)
                .set(validated)
                .where(eq(users.privyDID, validated.privyDID))
                .returning();
            return updated as User;
        } else {
            // Insert new user
            return await this.insert(validated);
        }
    }
}
