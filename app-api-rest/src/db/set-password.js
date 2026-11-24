// Crea un usuario administrador o cambia su contraseña.
// Uso: npm run set-password -- <usuario> <contraseña>
const db = require('./database');
const { hashPassword } = require('../services/auth');

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error('Uso: npm run set-password -- <usuario> <contraseña>');
  process.exit(1);
}
if (password.length < 8) {
  console.error('La contraseña debe tener al menos 8 caracteres');
  process.exit(1);
}

const hash = hashPassword(password);
const { changes } = db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, username);
if (changes === 0) {
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
  console.log(`✅ Usuario "${username}" creado`);
} else {
  console.log(`✅ Contraseña de "${username}" actualizada`);
}
db.close();
