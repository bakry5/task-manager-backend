const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config({ path: '.env' });

const dbConnection = require('./config/database');

if (process.env.NODE_ENV !== 'test') {
  dbConnection();
}

const app = express();

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const PORT = process.env.PORT || 8000;

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    console.error(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
    server.close(() => {
      console.error('Shutting down....');
      process.exit(1);
    });
  });
}

module.exports = app;
