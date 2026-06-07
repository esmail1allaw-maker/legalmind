import { createClient } from '@supabase/supabase-js';

// 1. ضع هنا الرابط الذي ستنسخه من صفحة General
const supabaseUrl = 'https://gnsjjsvugafxkwgmvcev.supabase.co'; 

// 2. ضع هنا المفتاح الطويل جداً (anon public) الظاهر أمامك في الصورة
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imduc2pqc3Z1Z2FmeGt3Z212Y2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MjQ3OTcsImV4cCI6MjA5NjQwMDc5N30.eh8hKRrm-5F89V2w3Q7i1k4QStiP0LHSGJVdQq4H3Ko'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);