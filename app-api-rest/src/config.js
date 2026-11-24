// Configuración central. Los valores se leen de variables de entorno
// o de un archivo .env en la raíz del proyecto (ver .env.example).
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.join(__dirname, '..');
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

module.exports = {
  ROOT,
  PORT: Number(process.env.PORT) || 3000,
  DB_PATH: process.env.DB_PATH || path.join(ROOT, 'library.sqlite'),
  UPLOADS_DIR: process.env.UPLOADS_DIR || path.join(ROOT, 'uploads'),

  // Autenticación del panel de administración
  AUTH_SECRET: process.env.AUTH_SECRET || '',
  TOKEN_TTL_HOURS: Number(process.env.TOKEN_TTL_HOURS) || 8,
  ADMIN_USER: process.env.ADMIN_USER || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
};
