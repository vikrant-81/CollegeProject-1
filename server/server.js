const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.locals.dbConnected = false;
app.locals.leadsStore = [];

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

app.get('/', (req, res) => {
  res.send({ message: 'Mini CRM backend is running.' });
});

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crm';

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  if (!app.locals.dbConnected) {
    console.log('Warning: backend is running without MongoDB. Data will not persist between restarts.');
  }
});

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 3000,
  serverSelectionTimeoutMS: 3000,
})
  .then(() => {
    app.locals.dbConnected = true;
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message || err);
    console.warn('MongoDB unavailable. Running with in-memory lead storage only.');
  });
