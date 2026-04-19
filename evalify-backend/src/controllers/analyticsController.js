import { query } from '../config/db.js';

// -- ATTENDANCE --

export const markAttendance = async (req, res) => {
    try {
        const { studentId, classId, materialId, materialTitle } = req.body;

        if (!studentId || !classId || !materialId) {
            return res.status(400).json({ error: 'Missing required attendance fields' });
        }

        const text = `
            INSERT INTO attendance (student_id, class_id, material_id, material_title)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (student_id, material_id) DO NOTHING
            RETURNING *;
        `;
        const result = await query(text, [studentId, classId, materialId, materialTitle]);

        res.status(201).json(result.rows[0] || { message: 'Attendance already marked' });
    } catch (err) {
        console.error('Error marking attendance:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAttendance = async (req, res) => {
    try {
        const result = await query('SELECT * FROM attendance ORDER BY timestamp DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching attendance:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// -- INTEGRITY LOGS --

export const logIntegrity = async (req, res) => {
    try {
        const { studentId, assignmentId, type, description } = req.body;

        if (!studentId || !assignmentId || !type) {
            return res.status(400).json({ error: 'Missing required integrity log fields' });
        }

        const text = `
            INSERT INTO integrity_logs (student_id, assignment_id, type, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const result = await query(text, [studentId, assignmentId, type, description]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error saving integrity log:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getIntegrityLogs = async (req, res) => {
    try {
        const result = await query('SELECT * FROM integrity_logs ORDER BY timestamp DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching integrity logs:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// -- ANNOUNCEMENTS --

export const getAnnouncements = async (req, res) => {
    try {
        const result = await query('SELECT * FROM announcements ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching announcements:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createAnnouncement = async (req, res) => {
    try {
        const { classId, content } = req.body;
        if (!classId || !content) return res.status(400).json({ error: 'Missing fields' });

        const text = 'INSERT INTO announcements (class_id, content) VALUES ($1, $2) RETURNING *';
        const result = await query(text, [classId, content]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating announcement:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
