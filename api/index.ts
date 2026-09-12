import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from '../backend/src/routes/health';
import authRouter from '../backend/src/routes/auth';
import customerRouter from '../backend/src/routes/customer';
import productRouter from '../backend/src/routes/product';
import challanRouter from '../backend/src/routes/challan';
import dashboardRouter from '../backend/src/routes/dashboard';
import { authenticate } from '../backend/src/middleware/auth';

dotenv.config();

const app = express();

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://stockly-frontend-3f3s.vercel.app',
  'https://stockly-frontend-two.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    const envOrigins = (process.env.FRONTEND_URL || '')
      .split(',')
      .map(o => o.trim().replace(/\/$/, ''))
      .filter(Boolean);
    const allowedOrigins = [...defaultAllowedOrigins, ...envOrigins];
    const isAllowed = allowedOrigins.includes(cleanOrigin) || 
                      cleanOrigin.endsWith('.vercel.app') ||
                      cleanOrigin.includes('vercel.app');
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle routes with or without /api prefix
app.use(['/api/health', '/health'], healthRouter);
app.use(['/api/auth', '/auth'], authRouter);
app.use(['/api/customers', '/customers'], authenticate, customerRouter);
app.use(['/api/products', '/products'], authenticate, productRouter);
app.use(['/api/challans', '/challans'], authenticate, challanRouter);
app.use(['/api/dashboard', '/dashboard'], authenticate, dashboardRouter);

app.get(['/api', '/'], (req, res) => {
  res.json({
    message: 'Welcome to the ERP CRM Portal API',
    version: '1.0.1',
    documentation: 'See README for API usage and setup.'
  });
});

export default app;
