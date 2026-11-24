const path = require('node:path');
const express = require('express');
const cors = require('cors');

require('./db/database'); // conecta y crea las tablas si no existen

const booksRoutes = require('./routes/books.routes');
const authorsRoutes = require('./routes/authors.routes');
const categoriesRoutes = require('./routes/categories.routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Frontend e imágenes subidas
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API
app.get('/api', (req, res) => res.json({ message: 'API de la Biblioteca 📚' }));
app.use('/api/books', booksRoutes);
app.use('/api/authors', authorsRoutes);
app.use('/api/categories', categoriesRoutes);

// 404 para rutas de la API y manejador de errores (siempre al final)
app.use('/api', notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));
}

module.exports = app;
