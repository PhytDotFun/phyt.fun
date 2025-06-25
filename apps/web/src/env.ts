import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
    server: {},
    clientPrefix: "PUBLIC_",
    client: {
        PUBLIC_PRIVY_CLIENT_ID: z.string(),
        PUBLIC_PRIVY_APP_ID: z.string(),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
