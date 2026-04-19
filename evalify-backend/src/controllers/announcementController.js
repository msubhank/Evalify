import { query } from '../config/db.js';

export const createAnnouncement = async (req, res) => {
    try {
        const { classId, title, content, type, author } = req.body;

        if (!classId || !content) {
            return res.status(400).json({ error: 'Missing required announcement fields' });
        }

        const text = `
            INSERT INTO announcements (class_id, title, content, type, author)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const result = await query(text, [classId, title, content, type || 'GENERAL', author]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating announcement:', err);
        res.status(500).json({ error: 'Internal server error while creating announcement' });
    }
};

export const getClassAnnouncements = async (req, res) => {
    try {
        const { classId } = req.params;
        const result = await query('SELECT * FROM announcements WHERE class_id = $1 ORDER BY created_at DESC', [classId]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching announcements:', err);
        res.status(500).json({ error: 'Internal server error while fetching announcements' });
    }
};

export const getUserAnnouncements = async (req, res) => {
    try {
        const { userId } = req.params;

        const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        const role = userResult.rows[0].role;

        let annResult;
        if (role === 'TEACHER') {
            annResult = await query(`
                 SELECT a.* 
                 FROM announcements a
                 JOIN classes c ON a.class_id = c.id
                 WHERE c.teacher_id = $1
                 ORDER BY a.created_at DESC
             `, [userId]);
        } else {
            annResult = await query(`
                 SELECT a.* 
                 FROM announcements a
                 JOIN class_enrollments ce ON a.class_id = ce.class_id
                 WHERE ce.student_id = $1
                 ORDER BY a.created_at DESC
             `, [userId]);
        }

        res.status(200).json(annResult.rows);
    } catch (err) {
        console.error('Error fetching user announcements:', err);
        res.status(500).json({ error: 'Internal server error while fetching announcements' });
    }
};

export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM announcements WHERE id = $1', [id]);
        res.status(200).json({ message: 'Announcement deleted successfully' });
    } catch (err) {
        console.error('Error deleting announcement:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
