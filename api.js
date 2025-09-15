const { join } = require('path');
const express = require('express');
const { errorHandler } = require('./middleware');
const healthRoutes = require('./routes/health');
const changelog = require('./routes/changelog');
const version = require('./routes/version');
const api = express();

// Register health route BEFORE static content handler
api.use('/health', healthRoutes);

// Static files
api.use(express.static(join(__dirname, 'public')));
api.use('/uploads', express.static(join(__dirname, 'data/uploads')));

// Body parser
api.use(express.json());

// Link controllers with routes
api.use('/api/apps', require('./routes/apps'));
api.use('/api/config', require('./routes/config'));
api.use('/api/weather', require('./routes/weather'));
api.use('/api/categories', require('./routes/category'));
api.use('/api/bookmarks', require('./routes/bookmark'));
api.use('/api/queries', require('./routes/queries'));
api.use('/api/auth', require('./routes/auth'));
api.use('/api/themes', require('./routes/themes'));
<<<<<<< HEAD
api.use('/api/changelog', changelog);
api.use('/app/changelog', changelog);
api.use('/api/version', version);

api.get(/^\/(?!api)/, (req, res) => {
  res.sendFile(join(__dirname, 'public/index.html'));
});
app.use('/health', require('./routes/health'));

// Custom error handler
api.use(errorHandler);

module.exports = api;
