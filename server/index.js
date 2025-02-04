const express = require('express');
const dotenv = require('dotenv');
const { configureHelmet } = require('./config/helmetConfig');
const { configureRateLimiter } = require('./middleware/rateLimiter');
const { trimWhitespace, logRequests } = require('./middleware');
const routes = require('./routes');
const compression = require('compression');

dotenv.config();

const app = express();
const port = process.env.SERVER_PORT || 5000;

// Logging
const morgan = require('morgan');
app.use(morgan('combined'));

// Security headers
configureHelmet(app);

const cors = require('cors');
app.use(cors());

app.enable('trust proxy');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(trimWhitespace);
app.use(logRequests);
//no need for rate limiter in development
if (process.env.NODE_ENV !== 'development') {
  app.use(configureRateLimiter());
}
app.use(compression());

// Routes
app.use('/', routes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});
// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Erreur interne du serveur'
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
