const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config({ path: '.env' });

const ApiError = require('./utils/apiError');
const globalError = require('./middlewares/errorMiddleware');
const dbConnection = require('./config/database');

const authRoute = require('./routes/authRoute');
const projectRoute = require('./routes/projectRoute');

dbConnection();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/projects', projectRoute);

app.get('/', (req, res) => {
  res.send('server is running');
});

app.all('*', (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

app.use(globalError);

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
