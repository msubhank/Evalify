import { query } from '../config/db.js';

export const createAssignment = async (req, res) => {
    try {
        const { title, description, classId, type, deadline, durationValue, durationUnit, starterCode, language } = req.body;

        if (!title || !classId || !type) {
            return res.status(400).json({ error: 'Missing required assignment fields' });
        }

        const text = `
            INSERT INTO assignments (title, description, class_id, type, deadline, duration, duration_unit, starter_code, language)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
        const result = await query(text, [
            title,
            description,
            classId,
            type,
            deadline || null,
            durationValue || null,
            durationUnit || null,
            starterCode || '',
            language || 'javascript'
        ]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating assignment:', err);
        res.status(500).json({ error: 'Internal server error while creating assignment' });
    }
};

export const getUserAssignments = async (req, res) => {
    try {
        const { userId } = req.params;

        const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        const role = userResult.rows[0].role;

        let assignmentsResult;
        if (role === 'TEACHER') {
            assignmentsResult = await query(`
                 SELECT a.* 
                 FROM assignments a
                 JOIN classes c ON a.class_id = c.id
                 WHERE c.teacher_id = $1
                 ORDER BY a.created_at DESC
             `, [userId]);
        } else {
            assignmentsResult = await query(`
                 SELECT a.* 
                 FROM assignments a
                 JOIN class_enrollments ce ON a.class_id = ce.class_id
                 WHERE ce.student_id = $1
                 ORDER BY a.created_at DESC
             `, [userId]);
        }

        res.status(200).json(assignmentsResult.rows);

    } catch (err) {
        console.error('Error fetching user assignments:', err);
        res.status(500).json({ error: 'Internal server error while fetching user assignments' });
    }
};

export const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM assignments WHERE id = $1', [id]);
        res.status(200).json({ message: 'Assignment deleted successfully' });
    } catch (err) {
        console.error('Error deleting assignment:', err);
        res.status(500).json({ error: 'Internal server error while deleting assignment' });
    }
};

export const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, deadline, durationValue, durationUnit, starterCode, language } = req.body;

        const text = `
            UPDATE assignments 
            SET title = $1, description = $2, deadline = $3, duration = $4, duration_unit = $5, starter_code = $6, language = $7
            WHERE id = $8
            RETURNING *;
        `;
        const result = await query(text, [
            title,
            description,
            deadline || null,
            durationValue || null,
            durationUnit || null,
            starterCode || '',
            language || 'javascript',
            id
        ]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Assignment not found' });
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error updating assignment:', err);
        res.status(500).json({ error: 'Internal server error while updating assignment' });
    }
};

// -- SUBMISSION AND ATTEMPTS --

export const saveSubmission = async (req, res) => {
    try {
        const { studentId, assignmentId, code, language, status, score, feedback, output, totalMarks } = req.body;

        if (!studentId || !assignmentId) {
            return res.status(400).json({ error: 'Missing student ID or assignment ID' });
        }

        const text = `
            INSERT INTO submissions (student_id, assignment_id, code, language, status, score, feedback, output, total_marks)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (student_id, assignment_id) 
            DO UPDATE SET 
                code = EXCLUDED.code, 
                language = EXCLUDED.language, 
                status = EXCLUDED.status, 
                score = EXCLUDED.score, 
                feedback = EXCLUDED.feedback,
                output = EXCLUDED.output,
                total_marks = EXCLUDED.total_marks,
                submitted_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const result = await query(text, [studentId, assignmentId, code, language, status || 'SUBMITTED', score || null, feedback || null, output || '', totalMarks || null]);

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error saving submission:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getSubmissions = async (req, res) => {
    try {
        const { assignmentId, studentId, teacherId } = req.query;
        let result;

        // Base query with joins to get student and assignment metadata
        const baseQuery = `
            SELECT s.*, u.name as student_name, a.title as assignment_title 
            FROM submissions s
            JOIN users u ON s.student_id = u.id
            JOIN assignments a ON s.assignment_id = a.id
        `;

        if (assignmentId && studentId) {
            result = await query(`${baseQuery} WHERE s.assignment_id = $1 AND s.student_id = $2`, [assignmentId, studentId]);
        } else if (assignmentId) {
            result = await query(`${baseQuery} WHERE s.assignment_id = $1 ORDER BY s.submitted_at DESC`, [assignmentId]);
        } else if (studentId) {
            result = await query(`${baseQuery} WHERE s.student_id = $1 ORDER BY s.submitted_at DESC`, [studentId]);
        } else if (teacherId) {
            // Get all submissions for all classes taught by this teacher
            result = await query(`
                ${baseQuery}
                JOIN classes c ON a.class_id = c.id
                WHERE c.teacher_id = $1
                ORDER BY s.submitted_at DESC
            `, [teacherId]);
        } else {
            result = await query(`${baseQuery} ORDER BY s.submitted_at DESC`);
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching submissions:', err);
        res.status(500).json({ error: 'Internal server error while fetching submissions' });
    }
};

export const startAttempt = async (req, res) => {
    try {
        const { studentId, assignmentId } = req.body;

        const text = `
            INSERT INTO attempts (student_id, assignment_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            RETURNING *;
        `;
        const result = await query(text, [studentId, assignmentId]);
        res.status(201).json(result.rows[0] || { message: 'Attempt already started' });
    } catch (err) {
        console.error('Error starting attempt:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAttempts = async (req, res) => {
    try {
        const { studentId, assignmentId } = req.query;
        let result;
        if (studentId && assignmentId) {
            result = await query('SELECT * FROM attempts WHERE student_id = $1 AND assignment_id = $2', [studentId, assignmentId]);
        } else if (studentId) {
            result = await query('SELECT * FROM attempts WHERE student_id = $1', [studentId]);
        } else {
            result = await query('SELECT * FROM attempts');
        }
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching attempts:', err);
        res.status(500).json({ error: 'Internal server error while fetching attempts' });
    }
};
