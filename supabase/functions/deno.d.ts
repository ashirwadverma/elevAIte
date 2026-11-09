// Ambient type declarations for Supabase Deno Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  };
};

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare module "https://esm.sh/unpdf@0.11.0" {
  export const extractText: any;
  export const getDocumentProxy: any;
}

declare module "https://esm.sh/fflate@0.8.2" {
  export const unzipSync: any;
}
