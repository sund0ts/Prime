import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import staffRoutes from './routes/staff.js';
import punishmentRoutes from './routes/punishments.js';
import inactiveRoutes from './routes/inactives.js';
import logRoutes from './routes/logs.js';
import applicationsRoutes from './routes/applications.js';
import leadershipRoutes from './routes/leadership.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/punishments', punishmentRoutes);
app.use('/api/inactives', inactiveRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/leadership', leadershipRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Arizona Prime API: http://localhost:${PORT}`));
