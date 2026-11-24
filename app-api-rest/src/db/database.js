const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');
const { DB_PATH } = require('../config');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);

// SQLite trae las llaves foráneas desactivadas por defecto
db.pragma('foreign_keys = ON');
// Mejor rendimiento para lecturas y escrituras simultáneas
db.pragma('journal_mode = WAL');

// Crear las tablas si no existen
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Migraciones: columnas nuevas para bases de datos creadas con una versión anterior
function addColumnIfMissing(table, column, definition) {
  const exists = db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column);
  if (!exists) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

addColumnIfMissing('books', 'copies', 'INTEGER NOT NULL DEFAULT 1 CHECK (copies >= 0)');

module.exports = db;
