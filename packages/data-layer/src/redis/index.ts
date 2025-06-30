/* eslint-disable @typescript-eslint/no-unused-vars */

export const redisClient = {
    // Mock methods
    get: async (key: string) => null,
    set: async (key: string, value: string) => {}
};

console.warn(
    'WARNING: Using mock Redis client. Please implement the actual client.'
);
