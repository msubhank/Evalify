import { query } from './config/db.js';

async function migrate() {
    try {
        await query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS total_marks INTEGER DEFAULT 100;");
        console.log("Migration successful: total_marks added to submissions.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
