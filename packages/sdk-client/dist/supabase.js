"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabase = exports.initSupabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const SUPABASE_URL = 'https://spb.tbema.net';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwNjcwMDAwLCJleHAiOjE5MTg0MzY0MDB9.eE4x5nop2S1tnH-v8Z5XYL_OWCqxMb8sOtHjnbyThNM';
// Custom fetch with timeout
const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    }
    catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - Supabase may be unavailable');
        }
        throw error;
    }
};
let supabaseInstance = null;
const initSupabase = (storage) => {
    if (supabaseInstance)
        return supabaseInstance;
    supabaseInstance = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
exports.initSupabase = initSupabase;
const getSupabase = () => {
    if (!supabaseInstance) {
        throw new Error('Supabase not initialized. Call initSupabase first.');
    }
    return supabaseInstance;
};
exports.getSupabase = getSupabase;
