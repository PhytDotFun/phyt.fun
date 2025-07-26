import type { Redis } from 'ioredis';
import type { Run, MarkRun, SelectRun } from '@phyt/data-access/models/runs';
import {
    RunPostSchema,
    MarkRunPostedSchema
} from '@phyt/data-access/models/runs';
import type { IdEncoder, EntityType } from '@phyt/core/contracts';

import type { RunsRepository } from './repository';

interface RunsServiceDeps {
    runsRepository: RunsRepository;
    redis: Redis;
    idEncoder: IdEncoder;
}

export class RunsService {
    private repo: RunsRepository;
    private redis: Redis;
    private idEncoder: IdEncoder;

    private readonly RUN_CACHE_TTL = 15 * 60; // 15 minutes
    private readonly ENTITY_TYPE: EntityType = 'runs';

    constructor(deps: RunsServiceDeps) {
        this.repo = deps.runsRepository;
        this.redis = deps.redis;
        this.idEncoder = deps.idEncoder;
    }

    // Generate cache keys for different lookup types
    private getCacheKey(
        type: string,
        identifier: string,
        ...params: string[]
    ): string {
        const parts = ['run', type, identifier, ...params].filter(Boolean);
        return parts.join(':');
    }

    private transformCachedData(cachedData: unknown): unknown {
        if (!cachedData || typeof cachedData !== 'object') {
            return cachedData;
        }

        if (Array.isArray(cachedData)) {
            return cachedData.map((item) => this.transformCachedData(item));
        }

        const data = cachedData as Record<string, unknown>;
        const transformed = { ...data };

        if (typeof transformed.createdAt === 'string') {
            transformed.createdAt = new Date(transformed.createdAt);
        }
        if (typeof transformed.updatedAt === 'string') {
            transformed.updatedAt = new Date(transformed.updatedAt);
        }
        if (typeof transformed.deletedAt === 'string') {
            transformed.deletedAt = new Date(transformed.deletedAt);
        }
        if (typeof transformed.startTime === 'string') {
            transformed.startTime = new Date(transformed.startTime);
        }
        if (typeof transformed.endTime === 'string') {
            transformed.endTime = new Date(transformed.endTime);
        }

        return transformed;
    }

    async getRunByPublicId(publicId: string): Promise<Run | null> {
        try {
            const id = this.idEncoder.decode(this.ENTITY_TYPE, publicId);
            if (!id) throw new Error('Failed to find run id');

            return await this.getRunById(id);
        } catch (error) {
            console.error('Error fetching run by id', error);
            return null;
        }
    }

    async getRunById(id: number): Promise<Run | null> {
        const cacheKey = this.getCacheKey('id', id.toString());

        try {
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                const parsedJson: unknown = JSON.parse(cached);
                const transformedData = this.transformCachedData(parsedJson);
                const parsed =
                    RunPostSchema.nullable().safeParse(transformedData);
                if (parsed.success) {
                    return parsed.data;
                }
                await this.redis.del(cacheKey);
            }
        } catch (error) {
            console.error(
                '[CACHE] Redis GET error for key',
                cacheKey,
                ':',
                error
            );
        }
        try {
            const run = await this.repo.findByRunId(id);

            if (!run) throw new Error('Could not find run in Cache or DB');

            const returnedRun = {
                duration: run.duration,
                id: this.idEncoder.encode(this.ENTITY_TYPE, run.id),
                startTime: run.startTime,
                endTime: run.endTime,
                distance: run.distance,
                averageSpeed: run.averageSpeed,
                averagePace: run.averagePace,
                averageHeartRate: run.averageHeartRate,
                maxHeartRate: run.maxHeartRate,
                isIndoor: run.isIndoor,
                toPost: run.toPost,
                isPosted: run.isPosted
            };

            RunPostSchema.parse(returnedRun);

            try {
                await this.redis.set(
                    cacheKey,
                    JSON.stringify(returnedRun),
                    'EX',
                    this.RUN_CACHE_TTL
                );
            } catch (error) {
                console.error(
                    '[CACHE] Redis SET error for key',
                    cacheKey,
                    ':',
                    error
                );
            }

            return returnedRun;
        } catch (error) {
            console.error('Error fetching run by id', error);
            return null;
        }
    }

    async markRunAsPosted(update: MarkRun): Promise<Run | null> {
        try {
            MarkRunPostedSchema.parse(update);

            const internalId = this.idEncoder.decode(
                this.ENTITY_TYPE,
                update.id
            );
            if (!internalId) {
                throw new Error('Failed to decode run ID');
            }

            const updateWithInternalId = {
                id: internalId,
                toPost: update.toPost,
                isPosted: update.isPosted
            };

            const result = await this.repo.update(updateWithInternalId);

            if (!result) throw new Error('Error updating run post status');

            const updatedRun = {
                duration: result.duration,
                id: this.idEncoder.encode(this.ENTITY_TYPE, result.id),
                startTime: result.startTime,
                endTime: result.endTime,
                distance: result.distance,
                averageSpeed: result.averageSpeed,
                averagePace: result.averagePace,
                averageHeartRate: result.averageHeartRate,
                maxHeartRate: result.maxHeartRate,
                isIndoor: result.isIndoor,
                toPost: result.toPost,
                isPosted: result.isPosted
            };

            return updatedRun;
        } catch (error) {
            console.error('Error marking run as posted', error);
            return null;
        }
    }

    async checkRunsToPost(): Promise<SelectRun[] | null> {
        try {
            const result = await this.repo.runsToCheck();

            return result;
        } catch (error) {
            console.error('Error fetching runs needing to be posted', error);
            return null;
        }
    }

    async fixPostedRunToPost(id: number): Promise<SelectRun | null> {
        try {
            const fixedRun = await this.repo.fixToPostRun(id);

            return fixedRun ?? null;
        } catch (error) {
            console.error(
                'Error fixing to_post flags on runs with is_posted flag',
                error
            );
            return null;
        }
    }

    async fixPostedRunsToPost(): Promise<SelectRun[] | null> {
        try {
            const fixedRuns = await this.repo.fixToPostRuns();

            return fixedRuns;
        } catch (error) {
            console.error(
                'Error fixing to_post flags on runs with is_posted flag',
                error
            );
            return null;
        }
    }
}
