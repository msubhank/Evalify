import { query } from '../config/db.js';

export const checkRegNo = async (req, res) => {
    try {
        const { regNo } = req.params;
        const text = `SELECT id FROM users WHERE reg_no = $1`;
        const result = await query(text, [regNo]);

        if (result.rows.length > 0) {
            return res.status(200).json({ exists: true });
        }
        res.status(200).json({ exists: false });
    } catch (err) {
        console.error('Error checking regNo:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const syncUser = async (req, res) => {
    try {
        const { id, email, role, name, regNo } = req.body;

        if (!id || !email || !role || !name) {
            return res.status(400).json({ error: 'Missing required user fields' });
        }

        // Insert user into PostgreSQL
        const text = `
            INSERT INTO users (id, email, role, name, reg_no)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO NOTHING
        `;
        const values = [id, email, role, name, regNo || null];

        await query(text, values);

        res.status(200).json({ message: 'User synced successfully' });
    } catch (err) {
        console.error('Error syncing user:', err);
        res.status(500).json({ error: 'Internal server error while syncing user', details: err.message });
    }
};

export const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const text = `
            SELECT 
                u.id, u.email, u.role, u.name, u.reg_no as "regNo", u.created_at,
                COALESCE(
                    (SELECT array_agg(c.code) 
                     FROM class_enrollments ce
                     JOIN classes c ON ce.class_id = c.id
                     WHERE ce.student_id = u.id), 
                '{}') as "joinedClasses"
            FROM users u
            WHERE u.id = $1
        `;
        const result = await query(text, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Internal server error while fetching user' });
    }
};
