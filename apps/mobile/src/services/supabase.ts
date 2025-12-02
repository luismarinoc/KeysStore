import { getSupabase } from '@keysstore/sdk-client';

// Proxy to delay access to getSupabase() until SDK is initialized
export const supabase = new Proxy({}, {
    get(_target, prop) {
        return (getSupabase() as any)[prop];
    }
}) as any;
