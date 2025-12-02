import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageAdapter } from './storage-adapter';

const SUPABASE_URL = 'https://spb.tbema.net';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwNjcwMDAwLCJleHAiOjE5MTg0MzY0MDB9.eE4x5nop2S1tnH-v8Z5XYL_OWCqxMb8sOtHjnbyThNM';

// Custom fetch with timeout
const fetchWithTimeout = async (
    url: RequestInfo | URL,
    options: RequestInit = {},
    timeout = 5000
): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - Supabase may be unavailable');
        }
        throw error;
    }
};

let supabaseInstance: SupabaseClient | null = null;

export const initSupabase = (storage: StorageAdapter): SupabaseClient => {
    if (supabaseInstance) return supabaseInstance;

    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            storage: storage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
        global: {
            fetch: fetchWithTimeout,
            headers: {
                'x-application-name': 'keystore',
            },
        },
    });
    return supabaseInstance;
};

export const getSupabase = (): SupabaseClient => {
    if (!supabaseInstance) {
        throw new Error('Supabase not initialized. Call initSupabase first.');
    }
    return supabaseInstance;
};

