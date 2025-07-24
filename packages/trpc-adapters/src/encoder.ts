import Hashids from 'hashids';
import { z } from 'zod';
import type { Dependencies } from '@phyt/core/di';

type EntityType = keyof Dependencies['salts'];

export class IdEncoder {
    private hashers: Map<EntityType, Hashids> = new Map();

    constructor(salts: Dependencies['salts']) {
        Object.entries(salts).forEach(([type, salt]) => {
            this.hashers.set(type as EntityType, new Hashids(salt, 8));
        });
    }

    encode(entityType: EntityType, id: number): string {
        const hasher = this.hashers.get(entityType);
        if (!hasher) throw new Error(`Unknown entity type: ${entityType}`);

        if (!Number.isInteger(id) || id <= 0) {
            throw new Error(
                `Invalid id: must be positive integer, got ${id.toString()}`
            );
        }

        return hasher.encode(id);
    }

    decode(entityType: EntityType, encodedId: string): number | null {
        const hasher = this.hashers.get(entityType);
        if (!hasher) throw new Error(`Unknown entity type: ${entityType}`);

        if (!encodedId || typeof encodedId !== 'string') {
            return null;
        }

        try {
            const decoded = hasher.decode(encodedId);
            return decoded.length > 0 ? Number(decoded[0]) : null;
        } catch (error) {
            console.warn(`Failed to decode hashid: ${encodedId}`, error);
            return null;
        }
    }

    encodedMany(entityType: EntityType, ids: number[]): string[] {
        return ids.map((id) => this.encode(entityType, id));
    }

    decodeMany(entityType: EntityType, encodedIds: string[]): number[] {
        return encodedIds
            .map((id) => this.decode(entityType, id))
            .filter((id): id is number => id !== null);
    }

    isValidEncodedId(entityType: EntityType, encodedId: string): boolean {
        const decoded = this.decode(entityType, encodedId);
        return decoded !== null && decoded > 0;
    }

    createValidationSchema(entityType: EntityType) {
        return z
            .string()
            .min(1, `${entityType} id cannot be emtpy`)
            .refine((val) => this.isValidEncodedId(entityType, val));
    }
}

export function createIdEncoder(salts: Dependencies['salts']): IdEncoder {
    return new IdEncoder(salts);
}

export type EncodedPostId = string;
export type EncodedRunId = string;
export type EncodedCommentId = string;
export type EncodedReactionId = string;
