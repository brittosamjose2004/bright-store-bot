import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wnhavivqgqkftxckgxxi.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduaGF2aXZxZ3FrZnR4Y2tneHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODgyNjgsImV4cCI6MjA4MDA2NDI2OH0.UYUfHhJiuLA4t_R3RX4yTEwvMOJS_PZsTFHnjuTtW5M";

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
