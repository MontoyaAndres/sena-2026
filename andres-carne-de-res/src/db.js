import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Crear tablas si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS platos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT    NOT NULL,
    descripcion TEXT,
    precio      REAL    NOT NULL,
    imagen      TEXT,
    ingredientes TEXT,
    creado_en   TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario       TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    creado_en     TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sesiones (
    token      TEXT    PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    expira_en  TEXT    NOT NULL
  );
`);

// Migraciones: agrega columnas nuevas a bases creadas con versiones anteriores
const columnas = db.prepare('PRAGMA table_info(platos)').all().map((c) => c.name);
if (!columnas.includes('imagen')) {
  db.exec('ALTER TABLE platos ADD COLUMN imagen TEXT');
}
if (!columnas.includes('ingredientes')) {
  db.exec('ALTER TABLE platos ADD COLUMN ingredientes TEXT');
}

// Datos de ejemplo la primera vez
const { total } = db.prepare('SELECT COUNT(*) AS total FROM platos').get();
if (total === 0) {
  const insertar = db.prepare(
    'INSERT INTO platos (nombre, descripcion, precio) VALUES (?, ?, ?)'
  );
  insertar.run('Bandeja paisa', 'Frijoles, arroz, carne molida, chicharrón, huevo y aguacate', 38000);
  insertar.run('Ajiaco', 'Sopa de papa con pollo, mazorca y guascas', 32000);
  insertar.run('Churrasco', 'Corte de res a la parrilla con papa criolla', 54000);
}

// Fotos de los platos de ejemplo (solo si aún no tienen imagen)
const fotosEjemplo = {
  'Bandeja paisa': '/images/platos/bandeja-paisa.jpg',
  Ajiaco: '/images/platos/ajiaco.jpg',
  Churrasco: '/images/platos/churrasco.jpg',
};
const ponerFoto = db.prepare('UPDATE platos SET imagen = ? WHERE nombre = ? AND imagen IS NULL');
for (const [nombre, imagen] of Object.entries(fotosEjemplo)) ponerFoto.run(imagen, nombre);

// Ingredientes de los platos de ejemplo (solo si aún no tienen)
const ingredientesEjemplo = {
  'Bandeja paisa': 'Frijoles rojos, arroz blanco, carne molida, chicharrón, chorizo, huevo frito, tajada de plátano maduro, arepa, aguacate',
  Ajiaco: 'Pechuga de pollo desmechada, papa criolla, papa sabanera, papa pastusa, mazorca, guascas, crema de leche, alcaparras, aguacate',
  Churrasco: 'Corte de res a la parrilla, papa criolla, chimichurri, ensalada fresca',
};
const ponerIngredientes = db.prepare(
  'UPDATE platos SET ingredientes = ? WHERE nombre = ? AND ingredientes IS NULL'
);
for (const [nombre, ingredientes] of Object.entries(ingredientesEjemplo)) {
  ponerIngredientes.run(ingredientes, nombre);
}

// Usuario administrador inicial
const { usuarios } = db.prepare('SELECT COUNT(*) AS usuarios FROM usuarios').get();
if (usuarios === 0) {
  const usuario = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  db.prepare('INSERT INTO usuarios (usuario, password_hash) VALUES (?, ?)')
    .run(usuario, hashPassword(password));
  console.log(`Usuario inicial creado -> usuario: ${usuario} / contraseña: ${password}`);
}

export default db;
