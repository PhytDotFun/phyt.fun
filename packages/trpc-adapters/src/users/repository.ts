import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from '@phyt/data-access/db/schema';
import type { SelectUser, InsertUser } from '@phyt/data-access/models/users';
import {
    SelectUserSchema,
    InsertUserSchema
} from '@phyt/data-access/models/users';

interface UserRepositoryDeps {
    db: NodePgDatabase;
}

export class UserRepository {
    private db: NodePgDatabase;

    constructor(deps: UserRepositoryDeps) {
        this.db = deps.db;
    }

    private async first(q: Promise<SelectUser[]>): Promise<SelectUser | null> {
        const r = (await q)[0];
        if (!r) return null;
        SelectUserSchema.parse(r);
        return r;
    }

    findByUserId(id: number) {
        return this.first(
            this.db.select().from(users).where(eq(users.id, id)).limit(1)
        );
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

    findByWalletAddress(walletAddress: string) {
        return this.first(
            this.db
                .select()
                .from(users)
                .where(eq(users.walletAddress, walletAddress))
                .limit(1)
        );
    }

    async insert(data: unknown) {
        const validated: InsertUser = InsertUserSchema.parse(data);
        const [row] = await this.db.insert(users).values(validated).returning();
        return row as SelectUser;
    }

    async upsertByPrivyId(data: unknown) {
        // Turns out upsert is a word for an insert/update combo
        const validated: InsertUser = InsertUserSchema.parse(data);
        const existing = await this.findByPrivyDID(validated.privyDID);

        if (existing) {
            // Update existing user
            const [updated] = await this.db
                .update(users)
                .set(validated)
                .where(eq(users.privyDID, validated.privyDID))
                .returning();
            return updated as SelectUser;
        } else {
            // Insert new user
            return await this.insert(validated);
        }
    }
}
