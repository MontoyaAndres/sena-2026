import './layout.js';
import * as api from './api.js';

const form = document.getElementById('login-form');
const errorBox = form.querySelector('.form-error');
const submitBtn = form.querySelector('[type="submit"]');

// Solo se permite volver a rutas internas (evita redirecciones a otros sitios)
function nextUrl() {
  const next = new URLSearchParams(location.search).get('next') || '';
  return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login.html') ? next : '/admin.html';
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

// Si ya hay una sesión válida, ir directo al panel
if (api.isLoggedIn()) {
  api
    .getMe()
    .then(() => location.replace(nextUrl()))
    .catch(() => api.clearToken());
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.hidden = true;

  const username = form.elements.username.value.trim();
  const password = form.elements.password.value;
  if (!username || !password) {
    showError('Escribe tu usuario y contraseña');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Ingresando…';
  try {
    await api.login(username, password);
    location.replace(nextUrl());
  } catch (err) {
    showError(err.message);
    form.elements.password.value = '';
    form.elements.password.focus();
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Iniciar sesión';
  }
});

form.elements.username.focus();
