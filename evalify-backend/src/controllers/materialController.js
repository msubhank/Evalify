import { query } from '../config/db.js';

export const createMaterial = async (req, res) => {
    try {
        const { title, description, classId, fileUrl, type } = req.body;

        if (!title || !classId) {
            return res.status(400).json({ error: 'Missing required material fields' });
        }

        const text = `
            INSERT INTO materials (title, description, class_id, file_url, type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const result = await query(text, [title, description, classId, fileUrl, type || 'DOCUMENT']);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating material:', err);
        res.status(500).json({ error: 'Internal server error while creating material' });
    }
};

export const getClassMaterials = async (req, res) => {
    try {
        const { classId } = req.params;
        const result = await query('SELECT * FROM materials WHERE class_id = $1 ORDER BY created_at DESC', [classId]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching materials:', err);
        res.status(500).json({ error: 'Internal server error while fetching materials' });
    }
};

export const getUserMaterials = async (req, res) => {
    try {
        const { userId } = req.params;

        const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        const role = userResult.rows[0].role;

        let matResult;
        if (role === 'TEACHER') {
            // For teachers, we fetch materials across all classes they teach
            matResult = await query(`
                 SELECT m.* 
                 FROM materials m
                 JOIN classes c ON m.class_id = c.id
                 WHERE c.teacher_id = $1
                 ORDER BY m.created_at DESC
             `, [userId]);
        } else {
            // For students, fetch materials for classes they are enrolled in
            matResult = await query(`
                 SELECT m.* 
                 FROM materials m
                 JOIN class_enrollments ce ON m.class_id = ce.class_id
                 WHERE ce.student_id = $1
                 ORDER BY m.created_at DESC
             `, [userId]);
        }

        res.status(200).json(matResult.rows);

    } catch (err) {
        console.error('Error fetching user materials:', err);
        res.status(500).json({ error: 'Internal server error while fetching user materials' });
    }
};

export const deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM materials WHERE id = $1', [id]);
        res.status(200).json({ message: 'Material deleted successfully' });
    } catch (err) {
        console.error('Error deleting material:', err);
        res.status(500).json({ error: 'Internal server error while deleting material' });
    }
};
