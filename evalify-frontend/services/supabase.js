import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://adadhbjetldculujncut.supabase.co';
const supabaseKey = 'sb_publishable_cgALGONTL2FrT_9uPcfmTQ_2CFVj87K';

export const supabase = createClient(supabaseUrl, supabaseKey);