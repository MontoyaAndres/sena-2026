import './layout.js';
import * as api from './api.js';
import { escapeHtml, bookCardHtml, loadingHtml, emptyHtml, errorHtml } from './ui.js';

const booksEl = document.getElementById('books');
const searchInput = document.getElementById('search');
const chipsEl = document.getElementById('category-chips');
const countEl = document.getElementById('results-count');

// Los filtros se guardan en la URL (?q=...&category=...) para poder compartirlos
const params = new URLSearchParams(location.search);
const filters = {
  search: params.get('q') ?? '',
  category: params.get('category') ?? '',
};
searchInput.value = filters.search;

function syncUrl() {
  const qs = new URLSearchParams();
  if (filters.search) qs.set('q', filters.search);
  if (filters.category) qs.set('category', filters.category);
  const query = qs.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
}

// ---------- Libros ----------
let requestId = 0; // evita que una respuesta vieja pise a una más nueva

async function loadBooks() {
  const current = ++requestId;
  booksEl.innerHTML = loadingHtml('Cargando libros…');
  countEl.textContent = '';

  try {
    const books = await api.getBooks(filters);
    if (current !== requestId) return;

    countEl.textContent = `${books.length} ${books.length === 1 ? 'libro' : 'libros'}`;
    if (books.length === 0) {
      const filtered = filters.search || filters.category;
      booksEl.innerHTML = emptyHtml(
        filtered ? 'No encontramos libros con esos filtros. Prueba con otra búsqueda.' : 'Todavía no hay libros en el catálogo.'
      );
      return;
    }
    booksEl.innerHTML = `<div class="book-grid">${books.map(bookCardHtml).join('')}</div>`;
  } catch (err) {
    if (current !== requestId) return;
    booksEl.innerHTML = errorHtml(`No se pudieron cargar los libros: ${err.message}`);
  }
}

// Búsqueda con espera de 300 ms para no llamar a la API en cada tecla
let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    filters.search = searchInput.value.trim();
    syncUrl();
    loadBooks();
  }, 300);
});

// ---------- Categorías (chips) ----------
function renderChips(categories) {
  const all = [{ id: '', name: 'Todas' }, ...categories];
  chipsEl.innerHTML = all
    .map(
      (c) =>
        `<button class="chip" type="button" data-category="${c.id}" aria-pressed="${String(c.id) === filters.category}">${escapeHtml(c.name)}</button>`
    )
    .join('');
}

chipsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-category]');
  if (!chip) return;
  filters.category = chip.dataset.category;
  chipsEl.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
  syncUrl();
  loadBooks();
});

// ---------- Estadísticas del hero ----------
function renderStats(authors, categories) {
  const totalBooks = categories.reduce((sum, c) => sum + c.book_count, 0);
  document.getElementById('stat-books').textContent = totalBooks;
  document.getElementById('stat-authors').textContent = authors.length;
  document.getElementById('stat-categories').textContent = categories.length;
}

// ---------- Inicio ----------
loadBooks();

Promise.all([api.getAuthors(), api.getCategories()])
  .then(([authors, categories]) => {
    // Si la categoría de la URL ya no existe, se muestra "Todas"
    if (filters.category && !categories.some((c) => String(c.id) === filters.category)) {
      filters.category = '';
      syncUrl();
      loadBooks();
    }
    renderChips(categories);
    renderStats(authors, categories);
  })
  .catch(() => {
    chipsEl.hidden = true; // los libros se siguen mostrando aunque fallen los filtros
  });
