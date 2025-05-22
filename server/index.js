import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/Authroute.js';
import eventRoutes from './routes/Eventroute.js';
import paymentRouter from './utils/PaymentRoute.js';
import connectRouter from './routes/ConnectRoute.js';
import walletRoutes from './routes/WalletRoute.js';

dotenv.config();
const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": [ 
        "'self'", 
        "https://*.stripe.com", 
        "https://m.stripe.network", 
        "'unsafe-inline'", 
        "'unsafe-eval'", 
        "blob:"
      ],
      "connect-src": [
        "'self'", 
        "https://*.stripe.com", 
        "https://r.stripe.com", 
        "https://api.stripe.com"
      ],
      "frame-src": [
        "https://*.stripe.com", 
        "https://js.stripe.com", 
        "https://hooks.stripe.com"
      ],
      "img-src": [
        "'self'", 
        "https://*.stripe.com", 
        "data:",
        "https://q.stripe.com" 
      ]
    }
  }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Stripe-Version']
}));

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payment', paymentRouter);
app.use('/api/connect', connectRouter);
app.use('/api', walletRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use((err, req, res, next) => {
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ msg: "Invalid ID format" });
  }
  console.error("Global Error:", err);
  res.status(500).json({ msg: "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));