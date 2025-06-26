import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
    server: {},
    clientPrefix: "VITE_",
    client: {
        VITE_PRIVY_CLIENT_ID: z.string(),
        VITE_PRIVY_APP_ID: z.string(),
    },
    runtimeEnv: import.meta.env,
    emptyStringAsUndefined: true,
    onValidationError: (error) => {
        console.error("Invalid environment variables:", error);
        throw new Error("Invalid environment variables");
    },
    onInvalidAccess: (variable) => {
        console.error(`Attempted to access invalid environment variable: ${variable}`);
        throw new Error(`Invalid environment variable: ${variable}`);
    },
});
