import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

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

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
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
