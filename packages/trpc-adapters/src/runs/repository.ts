import { eq, and, isNull } from 'drizzle-orm';
import type { SelectRun } from '@phyt/data-access/models/runs';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
    SelectRunSchema,
    UpdateRunSchema
} from '@phyt/data-access/models/runs';
import { runs } from '@phyt/data-access/db/schema';

interface RunsRepositoryDeps {
    db: NodePgDatabase;
}

export class RunsRepository {
    private db: NodePgDatabase;

    constructor(deps: RunsRepositoryDeps) {
        this.db = deps.db;
    }

    private async first(q: Promise<SelectRun[]>): Promise<SelectRun | null> {
        const r = (await q)[0];
        if (!r) return null;
        SelectRunSchema.parse(r);
        return r;
    }

    async findByRunId(id: number) {
        return await this.first(
            this.db.select().from(runs).where(eq(runs.id, id)).limit(1)
        );
    }

    async update(data: unknown) {
        const validated = UpdateRunSchema.parse(data);

        if (!validated.id) {
            throw new Error('Run ID is required for update');
        }

        // Filter out null values to avoid type conflicts with NOT NULL columns
        const updateData = Object.fromEntries(
            Object.entries({ ...validated, updatedAt: new Date() }).filter(
                ([_, value]) => value !== null
            )
        );

        const [updated] = await this.db
            .update(runs)
            .set({ ...updateData, updatedAt: new Date() })
            .where(and(eq(runs.id, validated.id), isNull(runs.deletedAt)))
            .returning();

        return updated || null;
    }

    async runsToCheck() {
        const runsToCheck = await this.db
            .select()
            .from(runs)
            .where(and(eq(runs.toPost, true), isNull(runs.deletedAt)));
        return runsToCheck;
    }

    async fixToPostRun(id: number) {
        const [fixed] = await this.db
            .update(runs)
            .set({ toPost: false, updatedAt: new Date() })
            .where(eq(runs.id, id))
            .returning();

        return fixed;
    }

    async fixToPostRuns() {
        const fixed = await this.db
            .update(runs)
            .set({ toPost: false, updatedAt: new Date() })
            .where(and(eq(runs.toPost, true), eq(runs.isPosted, true)))
            .returning();

        return fixed;
    }
}
