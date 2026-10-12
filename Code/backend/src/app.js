import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import errorHandler from './middleware/errorHandler.js';
import AppError from './utils/AppError.js';

// Route imports
import authRouter from './routes/auth.routes.js';
import patientsRouter from './routes/patients.routes.js';
import clinicalCasesRouter from './routes/clinicalCases.routes.js';
import autopsyCasesRouter from './routes/autopsyCases.routes.js';
import investigationsRouter from './routes/investigations.routes.js';
import documentsRouter from './routes/documents.routes.js';
import reportsRouter from './routes/reports.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import auditLogRouter from './routes/auditLog.routes.js';
import courtRecordsRouter from './routes/courtRecords.routes.js';

const app = express();

// Global Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/clinical-cases', clinicalCasesRouter);
app.use('/api/autopsy-cases', autopsyCasesRouter);
app.use('/api/investigations', investigationsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/audit-log', auditLogRouter);
app.use('/api/court-records', courtRecordsRouter);

// Undefined route handler
app.all('*path', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(errorHandler);

export default app;
