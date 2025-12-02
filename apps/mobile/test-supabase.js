// Quick test script to verify Supabase connection
// Run this in the browser console to test connectivity

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://spb.tbema.net';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwNjcwMDAwLCJleHAiOjE5MTg0MzY0MDB9.eE4x5nop2S1tnH-v8Z5XYL_OWCqxMb8sOtHjnbyThNM';

const testConnection = async () => {
    console.log('Testing Supabase connection...');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Test 1: List tables
    console.log('Test 1: Fetching from KEYS_projects...');
    const { data: projects, error: projectError } = await supabase
        .from('KEYS_projects')
        .select('*');

    console.log('Projects:', { data: projects, error: projectError });

    // Test 2: Insert a test project
    console.log('Test 2: Inserting test project...');
    const { data: inserted, error: insertError } = await supabase
        .from('KEYS_projects')
        .insert([{ name: 'Test Project' }])
        .select();

    console.log('Insert result:', { data: inserted, error: insertError });

    // Test 3: Check credentials table
    console.log('Test 3: Fetching from KEYS_credentials...');
    const { data: credentials, error: credError } = await supabase
        .from('KEYS_credentials')
        .select('*');

    console.log('Credentials:', { data: credentials, error: credError });
};

testConnection();
