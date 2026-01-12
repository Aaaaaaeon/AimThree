import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'leaderboard_db.json');

app.use(cors());
app.use(express.json());

// Initialize DB file if not exists
if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        static: [],   // Reflexe (mapped from 'static')
        tracking: [], // Tracking
        parkour: []   // Parkour
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

// Helper to read DB
function readDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        return { static: [], tracking: [], parkour: [] };
    }
}

// Helper to write DB
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// GET Scores
app.get('/api/scores/:mode', (req, res) => {
    const { mode } = req.params;
    const db = readDB();
    const scores = db[mode] || [];
    res.json(scores);
});

// POST Score
app.post('/api/scores', (req, res) => {
    const { pseudo, score, mode, accuracy } = req.body;
    
    if (!pseudo || score === undefined || !mode) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    
    // Validate pseudo length
    const cleanPseudo = pseudo.substring(0, 15).trim() || 'Anonymous';
    
    const db = readDB();
    if (!db[mode]) db[mode] = [];
    
    const newEntry = {
        pseudo: cleanPseudo,
        score: Number(score),
        accuracy: accuracy,
        date: new Date().toISOString()
    };
    
    db[mode].push(newEntry);
    
    // Sort by Score DESC (or ASC for Time/Parkour)
    if (mode === 'parkour') {
        db[mode].sort((a, b) => a.score - b.score); // Ascending for time
    } else {
        db[mode].sort((a, b) => b.score - a.score); // Descending for points
    }
    
    // Keep top 50
    if (db[mode].length > 50) {
        db[mode] = db[mode].slice(0, 50);
    }
    
    writeDB(db);
    
    res.json({ success: true, rank: db[mode].indexOf(newEntry) + 1, scores: db[mode] });
});

app.listen(PORT, () => {
    console.log(`Leaderboard Server running on http://localhost:${PORT}`);
});
