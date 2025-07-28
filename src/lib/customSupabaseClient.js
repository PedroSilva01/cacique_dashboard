import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fcphxhbgeocaupvtcbjq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcGh4aGJnZW9jYXVwdnRjYmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NTgzODMsImV4cCI6MjA2OTEzNDM4M30.78ArV2kBXqVah5-SOyelOvI-63FTvyIEe93bhDyDPPM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);