import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads', 'avatars');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safe = /^\.(jpe?g|png|gif|webp)$/i.test(ext) ? ext : '.jpg';
    cb(null, `avatar_${req.user.id}${safe}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ok = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
  cb(null, ok);
};

export const uploadAvatar = multer({ storage, fileFilter, limits: { fileSize: 3 * 1024 * 1024 } }).single('avatar');

const leadershipDir = path.join(__dirname, '..', 'uploads', 'leadership');
if (!fs.existsSync(leadershipDir)) {
  fs.mkdirSync(leadershipDir, { recursive: true });
}

const leadershipStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, leadershipDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safe = /^\.(jpe?g|png|gif|webp)$/i.test(ext) ? ext : '.jpg';
    cb(null, `leadership_${Date.now()}${safe}`);
  },
});

export const uploadLeadershipAvatar = multer({
  storage: leadershipStorage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
}).single('avatar');
