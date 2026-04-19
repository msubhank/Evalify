import { query } from '../config/db.js';

export const createClass = async (req, res) => {
    try {
        const { name, code, teacherId } = req.body;

        if (!name || !code || !teacherId) {
            return res.status(400).json({ error: 'Missing required class fields' });
        }

        const text = `
            INSERT INTO classes (code, name, teacher_id)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const result = await query(text, [code, name, teacherId]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating class:', err);
        if (err.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'Class code already exists' });
        }
        res.status(500).json({ error: 'Internal server error while creating class' });
    }
};

export const getClasses = async (req, res) => {
    try {
        const result = await query('SELECT * FROM classes ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching classes:', err);
        res.status(500).json({ error: 'Internal server error while fetching classes' });
    }
};

export const getClassByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const result = await query('SELECT * FROM classes WHERE code = $1', [code]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching class:', err);
        res.status(500).json({ error: 'Internal server error while fetching class' });
    }
};

export const joinClass = async (req, res) => {
    try {
        const { studentId, classCode } = req.body;

        if (!studentId || !classCode) {
            return res.status(400).json({ error: 'Missing student ID or class code' });
        }

        // 1. Get class ID from code
        const classResult = await query('SELECT id FROM classes WHERE code = $1', [classCode]);
        if (classResult.rows.length === 0) {
            return res.status(404).json({ error: 'Class not found with that code' });
        }
        const classId = classResult.rows[0].id;

        // 2. Insert into class_enrollments
        const enrollText = `
            INSERT INTO class_enrollments (student_id, class_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            RETURNING *;
        `;
        await query(enrollText, [studentId, classId]);

        res.status(200).json({ message: 'Successfully joined class', classId });
    } catch (err) {
        console.error('Error joining class:', err);
        res.status(500).json({ error: 'Internal server error while joining class' });
    }
};

export const getUserClasses = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find out if the user is a teacher or student to fetch the right classes
        const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const role = userResult.rows[0].role;

        let classResult;
        if (role === 'TEACHER') {
            classResult = await query('SELECT * FROM classes WHERE teacher_id = $1 ORDER BY created_at DESC', [userId]);
        } else {
            // Student
            classResult = await query(`
                SELECT c.* 
                FROM classes c
                JOIN class_enrollments ce ON c.id = ce.class_id
                WHERE ce.student_id = $1
                ORDER BY ce.joined_at DESC
            `, [userId]);
        }

        res.status(200).json(classResult.rows);
    } catch (err) {
        console.error('Error fetching user classes:', err);
        res.status(500).json({ error: 'Internal server error while fetching user classes' });
    }
};

export const getTeacherRoster = async (req, res) => {
    try {
        const { teacherId } = req.params;

        const text = `
            SELECT 
                u.id, u.name, u.email, u.role, u.reg_no as "regNo", u.created_at,
                COALESCE(
                    (SELECT array_agg(c2.code) 
                     FROM class_enrollments ce2
                     JOIN classes c2 ON ce2.class_id = c2.id
                     WHERE ce2.student_id = u.id), 
                '{}') as "joinedClasses"
            FROM users u
            JOIN class_enrollments ce ON u.id = ce.student_id
            JOIN classes c ON ce.class_id = c.id
            WHERE c.teacher_id = $1
            GROUP BY u.id
        `;
        const result = await query(text, [teacherId]);

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching teacher roster:', err);
        res.status(500).json({ error: 'Internal server error while fetching roster' });
    }
};
// };
