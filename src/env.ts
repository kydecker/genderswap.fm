import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
  TIDAL_CLIENT_ID: { schema: (value) => value },
  TIDAL_CLIENT_SECRET: { schema: (value) => value },
});
