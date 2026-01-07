import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './server/routes/auth.js';
import oddsRoutes from './server/routes/odds.js';
import parlaysRoutes from './server/routes/parlays.js';
import suggestionsRoutes from './server/routes/suggestions.js';
import statsRoutes from './server/routes/stats.js';

// Import database initialization
import { initDatabase } from './server/db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initDatabase();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://sportsbet.zyroi.com'
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/odds', oddsRoutes);
app.use('/api/parlays', parlaysRoutes);
app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'sportsbet'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));

  // Handle client-side routing (Express 5 syntax)
  app.get('/{*path}', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`SportsBet server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
