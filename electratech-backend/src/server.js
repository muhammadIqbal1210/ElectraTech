require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const batchRoutes = require('./routes/batch.routes');
const iotRoutes = require('./routes/iot.routes');
const trackingRoutes = require('./routes/tracking.routes');
const { errorHandler, notFoundHandler } = require('./utils/http');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'electratech-backend',
    database: 'postgresql',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/tracking', trackingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Electra Tech API running on http://localhost:${port}`);
});
