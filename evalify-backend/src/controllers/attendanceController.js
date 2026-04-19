import { query } from '../config/db.js';

export const markAttendance = async (req, res) => {
    try {
        const { studentId, classId, materialId, materialTitle } = req.body;

        if (!studentId || !materialId) {
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
        res.status(500).json({ error: 'Internal server error while marking attendance' });
    }
};

export const getAttendance = async (req, res) => {
    try {
        const { classId, studentId, teacherId, showArchived } = req.query;
        let result;
        const archivedFilter = showArchived === 'true' ? '' : 'AND is_archived = FALSE';

        if (teacherId) {
            result = await query(`
                SELECT a.* 
                FROM attendance a
                JOIN classes c ON a.class_id = c.id
                WHERE c.teacher_id = $1 ${archivedFilter}
                ORDER BY a.timestamp DESC
            `, [teacherId]);
        } else if (classId && studentId) {
            result = await query(`SELECT * FROM attendance WHERE class_id = $1 AND student_id = $2 ${archivedFilter} ORDER BY timestamp DESC`, [classId, studentId]);
        } else if (classId) {
            result = await query(`SELECT * FROM attendance WHERE class_id = $1 ${archivedFilter} ORDER BY timestamp DESC`, [classId]);
        } else if (studentId) {
            result = await query(`SELECT * FROM attendance WHERE student_id = $1 ${archivedFilter} ORDER BY timestamp DESC`, [studentId]);
        } else {
            result = await query(`SELECT * FROM attendance WHERE 1=1 ${archivedFilter} ORDER BY timestamp DESC`);
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching attendance:', err);
        res.status(500).json({ error: 'Internal server error while fetching attendance' });
    }
};

export const archiveAttendance = async (req, res) => {
    try {
        const { days = 30 } = req.body;
        const result = await query(`
            UPDATE attendance 
            SET is_archived = TRUE, archived_at = NOW() 
            WHERE timestamp < NOW() - INTERVAL '${days} days' AND is_archived = FALSE
            RETURNING *;
        `);
        res.status(200).json({ message: `${result.rowCount} records archived`, archived: result.rows });
    } catch (err) {
        console.error('Error archiving attendance:', err);
        res.status(500).json({ error: 'Internal server error while archiving attendance' });
    }
};
