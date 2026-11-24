import './layout.js';
import * as api from './api.js';
import { escapeHtml, bookCardHtml, loadingHtml, emptyHtml, errorHtml } from './ui.js';

const PAGE_SIZE = 12;

const booksEl = document.getElementById('books');
const searchInput = document.getElementById('search');
const chipsEl = document.getElementById('category-chips');
const availableInput = document.getElementById('only-available');
const countEl = document.getElementById('results-count');
const paginationEl = document.getElementById('pagination');
const catalogEl = document.getElementById('catalogo');

// Los filtros se guardan en la URL (?q=...&category=...&available=1&page=2) para poder compartirlos
const params = new URLSearchParams(location.search);
const filters = {
  search: params.get('q') ?? '',
  category: params.get('category') ?? '',
  available: params.get('available') === '1',
  page: Math.max(1, Number.parseInt(params.get('page'), 10) || 1),
};
searchInput.value = filters.search;
availableInput.checked = filters.available;

function syncUrl() {
  const qs = new URLSearchParams();
  if (filters.search) qs.set('q', filters.search);
  if (filters.category) qs.set('category', filters.category);
  if (filters.available) qs.set('available', '1');
  if (filters.page > 1) qs.set('page', String(filters.page));
  const query = qs.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
}

// Cambiar un filtro siempre vuelve a la página 1
function applyFilters() {
  filters.page = 1;
  syncUrl();
  loadBooks();
}

// ---------- Libros ----------
let requestId = 0; // evita que una respuesta vieja pise a una más nueva

async function loadBooks() {
  const current = ++requestId;
  booksEl.innerHTML = loadingHtml('Cargando libros…');
  countEl.textContent = '';
  paginationEl.hidden = true;

  try {
    const { data: books, pagination } = await api.getBooksPage({
      search: filters.search,
      category: filters.category,
      available: filters.available ? 1 : '',
      page: filters.page,
      limit: PAGE_SIZE,
    });
    if (current !== requestId) return;

    // Si la página pedida ya no existe (por ejemplo, ?page=99), ir a la última
    if (books.length === 0 && pagination.total > 0) {
      filters.page = pagination.totalPages;
      syncUrl();
      loadBooks();
      return;
    }

    countEl.textContent = `${pagination.total} ${pagination.total === 1 ? 'libro' : 'libros'}`;
    if (books.length === 0) {
      const filtered = filters.search || filters.category || filters.available;
      booksEl.innerHTML = emptyHtml(
        filtered ? 'No encontramos libros con esos filtros. Prueba con otra búsqueda.' : 'Todavía no hay libros en el catálogo.'
      );
      return;
    }
    booksEl.innerHTML = `<div class="book-grid">${books.map(bookCardHtml).join('')}</div>`;
    renderPagination(pagination);
  } catch (err) {
    if (current !== requestId) return;
    booksEl.innerHTML = errorHtml(`No se pudieron cargar los libros: ${err.message}`);
  }
}

// ---------- Paginación ----------
function renderPagination({ page, totalPages }) {
  if (totalPages <= 1) {
    paginationEl.hidden = true;
    return;
  }

  const pageButton = (n) =>
    `<button class="page-btn" type="button" data-page="${n}" ${n === page ? 'aria-current="page"' : ''} aria-label="Página ${n}">${n}</button>`;

  const numbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  paginationEl.innerHTML = `
    <button class="page-btn" type="button" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>‹ Anterior</button>
    ${numbers.map(pageButton).join('')}
    <button class="page-btn" type="button" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Siguiente ›</button>`;
  paginationEl.hidden = false;
}

paginationEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-page]');
  if (!btn || btn.disabled || btn.getAttribute('aria-current')) return;
  filters.page = Number(btn.dataset.page);
  syncUrl();
  loadBooks();
  catalogEl.scrollIntoView({ behavior: 'smooth' });
});

// ---------- Filtros ----------
// Búsqueda con espera de 300 ms para no llamar a la API en cada tecla
let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    filters.search = searchInput.value.trim();
    applyFilters();
  }, 300);
});

availableInput.addEventListener('change', () => {
  filters.available = availableInput.checked;
  applyFilters();
});

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
  applyFilters();
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
      applyFilters();
    }
    renderChips(categories);
    renderStats(authors, categories);
  })
  .catch(() => {
    chipsEl.hidden = true; // los libros se siguen mostrando aunque fallen los filtros
  });
