const path = require('node:path');
const express = require('express');
const cors = require('cors');

const config = require('./config');
require('./db/database'); // conecta y crea las tablas si no existen
const { ensureAdminUser } = require('./services/auth');

const authRoutes = require('./routes/auth.routes');
const booksRoutes = require('./routes/books.routes');
const authorsRoutes = require('./routes/authors.routes');
const categoriesRoutes = require('./routes/categories.routes');
const loansRoutes = require('./routes/loans.routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

ensureAdminUser();

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Frontend e imágenes subidas
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(config.UPLOADS_DIR));

// API
app.get('/api', (req, res) => res.json({ message: 'API de la Biblioteca 📚' }));
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/authors', authorsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/loans', loansRoutes);

// 404 para rutas de la API y manejador de errores (siempre al final)
app.use('/api', notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(config.PORT, () => console.log(`🚀 Servidor en http://localhost:${config.PORT}`));
}

module.exports = app;
