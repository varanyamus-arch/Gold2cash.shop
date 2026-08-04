import "@cloudflare/workers-types";

declare global {
  interface Env {
    DB: D1Database;
    GOLDAPI_KEY?: string;
  }
}

declare module "cloudflare:workers" {
  export const env: Env;
}
