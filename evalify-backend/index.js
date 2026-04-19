import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Import routes
import authRoutes from './src/routes/authRoutes.js';
import classRoutes from './src/routes/classRoutes.js';
import materialRoutes from './src/routes/materialRoutes.js';
import assignmentRoutes from './src/routes/assignmentRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import announcementRoutes from './src/routes/announcementRoutes.js';
import attendanceRoutes from './src/routes/attendanceRoutes.js';
import integrityRoutes from './src/routes/integrityRoutes.js';

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/integrity', integrityRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Evalify Backend is running.' });
});

// Code Execution Endpoint (Glot.io)
app.post('/api/execute', async (req, res) => {
    try {
        const { code, language, stdin } = req.body;

        if (!code || !language) {
            return res.status(400).json({ error: 'Code and language are required.' });
        }

        // Glot.io expects a specific format: {"files": [{"name": "main.js", "content": "..."}]}
        // We need to map our frontend language names to Glot.io runner names and default file names
        const languageMap = {
            'javascript': { runner: 'javascript', filename: 'main.js' },
            'python': { runner: 'python', filename: 'main.py' },
            'cpp': { runner: 'cpp', filename: 'main.cpp' },
            'java': { runner: 'java', filename: 'Main.java' }
        };

        const config = languageMap[language];
        if (!config) {
            return res.status(400).json({ error: 'Unsupported language.' });
        }

        const glotToken = process.env.GLOT_TOKEN;
        if (!glotToken) {
            console.error("Missing GLOT_TOKEN in backend .env");
            return res.status(500).json({ error: 'Execution engine configuration error.' });
        }

        const runPayload = {
            files: [
                {
                    name: config.filename,
                    content: code
                }
            ]
        };

        // Add stdin to payload if provided
        if (stdin !== undefined && stdin !== null) {
            runPayload.stdin = stdin;
        }

        const response = await axios.post(
            `https://glot.io/api/run/${config.runner}/latest`,
            runPayload,
            {
                headers: {
                    'Authorization': `Token ${glotToken}`,
                    'Content-type': 'application/json'
                }
            }
        );

        // Glot returns { stdout: "...", stderr: "...", error: "..." }
        res.status(200).json(response.data);

    } catch (error) {
        console.error("Code execution error:", error?.response?.data || error.message);
        res.status(500).json({ error: 'Failed to execute code on the server.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
