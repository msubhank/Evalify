import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// We expect DATABASE_URL in the .env file
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // If using Supabase standard connection string, usually ssl is required, 
    // but it depends on the environment. We'll add standard options.
    ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('supabase')
        ? { rejectUnauthorized: false }
        : false,
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();

export default pool;
