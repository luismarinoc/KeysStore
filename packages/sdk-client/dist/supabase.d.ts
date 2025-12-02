import { SupabaseClient } from '@supabase/supabase-js';
import { StorageAdapter } from './storage-adapter';
export declare const initSupabase: (storage: StorageAdapter) => SupabaseClient;
export declare const getSupabase: () => SupabaseClient;
