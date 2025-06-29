import type { LoggerOptions } from "pino";
import { env } from "./env.js";

// Define the transport based on the environment.
// In development, use 'pino-pretty' for human-readable logs.
// In production, output raw JSON for logging service to consume.
const transport: LoggerOptions['transport'] =
    env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname',
            },
        }
        : undefined;

/**
 * Standardized Pino logger options for the entire Phyt monorepo.
 * This object can be passed to any pino instance or pino-based middleware.
 */
export const PINO_LOGGER_OPTIONS: LoggerOptions = {
    // Minimum log level
    level: env.NODE_ENV === 'development' ? 'debug' : 'info',
    transport,
    // Add severity label to the log - better compatability for logger service
    formatters: {
        level: (label) => {
            return { severity: label.toUpperCase() };
        },
    },
    // ISO 8601 timestamp
    timestamp: true // pino-http/hono-pino often handles this, but true is a safe default.
};
