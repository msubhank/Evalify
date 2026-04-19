import pool from '../config/db.js';

async function updateSchema() {
    try {
        const client = await pool.connect();
        try {
            console.log('Updating announcements table schema...');
            await client.query(`
                ALTER TABLE announcements 
                ADD COLUMN IF NOT EXISTS title VARCHAR(255),
                ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'GENERAL',
                ADD COLUMN IF NOT EXISTS author VARCHAR(255);

                ALTER TABLE materials
                ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'DOCUMENT';

                ALTER TABLE attendance
                ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
                ADD COLUMN IF NOT EXISTS material_title VARCHAR(255),
                ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
                DROP CONSTRAINT IF EXISTS unique_attendance_per_material,
                ADD CONSTRAINT unique_attendance_per_material UNIQUE(student_id, material_id);
            `);
            console.log('Schema updated successfully!');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Failed to update schema:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

updateSchema();
