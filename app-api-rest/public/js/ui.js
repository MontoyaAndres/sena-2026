// Utilidades de interfaz compartidas por todas las páginas.

// Escapa texto antes de insertarlo con innerHTML (evita inyección de HTML/JS)
export function escapeHtml(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, (c) => map[c]);
}

// Imagen por defecto cuando un libro o autor no tiene imagen (o la imagen falla)
export const PLACEHOLDER_IMG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300">
      <rect width="200" height="300" fill="#f3eee6"/>
      <text x="100" y="165" font-size="64" text-anchor="middle">📖</text>
    </svg>`
  );

export const imgSrc = (url) => escapeHtml(url || PLACEHOLDER_IMG);

// Si una imagen no carga, se reemplaza por el placeholder
document.addEventListener(
  'error',
  (e) => {
    const img = e.target;
    if (img.tagName === 'IMG' && !img.dataset.fallback) {
      img.dataset.fallback = '1';
      img.src = PLACEHOLDER_IMG;
    }
  },
  true
);

// ---------- Tarjeta de libro (inicio, detalle y autor) ----------
// Toda la tarjeta lleva al detalle; el nombre del autor lleva a su página.
export function bookCardHtml(book) {
  return `
    <article class="book-card">
      <img src="${imgSrc(book.image)}" alt="" loading="lazy" />
      <div class="book-card-body">
        <span class="badge">${escapeHtml(book.category.name)}</span>
        <h3><a class="book-card-link" href="/book.html?id=${book.id}">${escapeHtml(book.title)}</a></h3>
        <a class="book-card-author" href="/author.html?id=${book.author.id}">${escapeHtml(book.author.name)}</a>
      </div>
    </article>`;
}

// Lee ?id= de la URL. Devuelve un entero positivo o null.
export function getIdFromUrl() {
  const id = Number(new URLSearchParams(location.search).get('id'));
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ---------- Estados de carga / vacío / error ----------
export const loadingHtml = (text = 'Cargando…') =>
  `<div class="state"><div class="spinner"></div>${escapeHtml(text)}</div>`;

export const emptyHtml = (text) => `<div class="state">${escapeHtml(text)}</div>`;

export const errorHtml = (text) => `<div class="state state-error">⚠️ ${escapeHtml(text)}</div>`;

// ---------- Toasts ----------
let toastContainer;

export function toast(message, type = 'success') {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toasts';
    toastContainer.setAttribute('role', 'status');
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.append(toastContainer);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  toastContainer.append(el);
  setTimeout(() => el.remove(), type === 'error' ? 6000 : 3500);
}

// ---------- Diálogo de confirmación (reemplaza window.confirm) ----------
export function confirmDialog(message, { confirmText = 'Eliminar' } = {}) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'dialog dialog-sm';
    dialog.innerHTML = `
      <form method="dialog">
        <div class="dialog-header"><h2>¿Estás seguro?</h2></div>
        <div class="dialog-body"><p>${escapeHtml(message)}</p></div>
        <div class="dialog-footer">
          <button class="btn btn-outline" value="cancel">Cancelar</button>
          <button class="btn btn-danger-solid" value="ok">${escapeHtml(confirmText)}</button>
        </div>
      </form>`;
    document.body.append(dialog);
    dialog.addEventListener('close', () => {
      resolve(dialog.returnValue === 'ok');
      dialog.remove();
    });
    dialog.showModal();
    dialog.querySelector('[value="cancel"]').focus();
  });
}
