import { query } from '../config/db.js';

export const logIntegrity = async (req, res) => {
    try {
        const { studentId, assignmentId, type, description } = req.body;

        if (!studentId || !type) {
            return res.status(400).json({ error: 'Missing required integrity log fields' });
        }

        const text = `
            INSERT INTO integrity_logs (student_id, assignment_id, type, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const result = await query(text, [studentId, assignmentId || null, type, description]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error logging integrity:', err);
        res.status(500).json({ error: 'Internal server error while logging integrity' });
    }
};

export const getIntegrityLogs = async (req, res) => {
    try {
        const { studentId, assignmentId, teacherId } = req.query;
        let result;

        if (teacherId) {
            // Fetch logs for all students in classes taught by this teacher
            result = await query(`
                SELECT il.*, u.name as student_name, a.title as assignment_title
                FROM integrity_logs il
                JOIN users u ON il.student_id = u.id
                LEFT JOIN assignments a ON il.assignment_id = a.id
                JOIN classes c ON a.class_id = c.id
                WHERE c.teacher_id = $1
                ORDER BY il.timestamp DESC
            `, [teacherId]);
        } else if (studentId && assignmentId) {
            result = await query('SELECT * FROM integrity_logs WHERE student_id = $1 AND assignment_id = $2 ORDER BY timestamp DESC', [studentId, assignmentId]);
        } else if (studentId) {
            result = await query('SELECT * FROM integrity_logs WHERE student_id = $1 ORDER BY timestamp DESC', [studentId]);
        } else {
            result = await query('SELECT * FROM integrity_logs ORDER BY timestamp DESC LIMIT 100');
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching integrity logs:', err);
        res.status(500).json({ error: 'Internal server error while fetching integrity logs' });
    }
};
