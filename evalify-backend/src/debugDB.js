import { query } from './config/db.js';

async function check() {
    try {
        const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'submissions';");
        console.log("JSON_START");
        console.log(JSON.stringify(res.rows, null, 2));
        console.log("JSON_END");
        process.exit(0);
    } catch (err) {
        console.error("Check failed:", err);
        process.exit(1);
    }
}

check();
