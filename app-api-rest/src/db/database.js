const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');

// El archivo de la base de datos queda en la raíz del proyecto
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'library.sqlite');

const db = new Database(DB_PATH);

// SQLite trae las llaves foráneas desactivadas por defecto
db.pragma('foreign_keys = ON');
// Mejor rendimiento para lecturas y escrituras simultáneas
db.pragma('journal_mode = WAL');

// Crear las tablas si no existen
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
