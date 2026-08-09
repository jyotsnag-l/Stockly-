import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import customerRouter from './routes/customer';
import productRouter from './routes/product';
import challanRouter from './routes/challan';
import dashboardRouter from './routes/dashboard';
import { authenticate } from './middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://stockly-frontend-3f3s.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                      (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) ||
                      origin.endsWith('.vercel.app');
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/customers', authenticate, customerRouter);
app.use('/products', authenticate, productRouter);
app.use('/challans', authenticate, challanRouter);
app.use('/dashboard', authenticate, dashboardRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the ERP CRM Portal API',
    version: '1.0.0',
    documentation: 'See README for API usage and setup.'
  });
});

// Global Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start Server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
