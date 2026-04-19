import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
    try {
        console.log('Reading init.sql...');
        const sqlPath = path.join(__dirname, 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing init.sql to create tables...');
        const client = await pool.connect();
        try {
            await client.query(sql);
            console.log('Database tables created successfully!');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Failed to setup database:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

setupDatabase();
