import express from 'express';
import 'dotenv/config';
import morgan from 'morgan';
import compression from 'compression';
import cors from 'cors';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

import connectDB from './utils/db.js';
import ApiError from './utils/apiError.js';
import errorHandler from './middleware/errorHandler.js';
import mountRoutes from './routes/index.js';

connectDB();

const app = express();


app.use(cors({
    origin: ["http://localhost:8000"], // allow frontend
    credentials: true // optional, only if you're using cookies/auth
  })); 
app.options('*', cors());
app.use(compression());
app.use(express.json({ limit: '20kb' }));

app.use(mongoSanitize());
app.use(xss());
app.use(hpp({
    whitelist: [
        'price',
        'sold',
        'quantity',
        'ratingsAverage',
        'ratingsQuantity'
    ],
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message:
        'Too many requests from this IP, please try again after 15 minutes'

});

app.use('/api', limiter);

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
    console.log(`mode: ${process.env.NODE_ENV}`);
};

mountRoutes(app);

app.all('*', (req, res, next) => {
    next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

app.use(errorHandler);

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
    console.log(`Server running on Port: ${PORT}`);
});

process.on('unhandledRejection', (err) => {
    console.log(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
    server.close(() => {
        console.log(`Shutting down....`);
        process.exit(1);
    });
});

