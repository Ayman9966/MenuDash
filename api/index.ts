import express from 'express';
import * as dotenv from 'dotenv';
import { initTelegram } from '../server/backendCore';
import { apiRouter } from '../server/routes';

dotenv.config();

const app = express();
initTelegram();

app.use(express.json({ limit: '10mb' }));
app.use('/api', apiRouter);

export default app;
