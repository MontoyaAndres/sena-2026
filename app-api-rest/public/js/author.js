import './layout.js';
import * as api from './api.js';
import { escapeHtml, imgSrc, bookCardHtml, getIdFromUrl, loadingHtml, emptyHtml, errorHtml } from './ui.js';

const page = document.getElementById('author-page');

const notFoundHtml = `
  ${emptyHtml('No encontramos este autor. Puede que haya sido eliminado.')}
  <p style="text-align:center"><a class="btn btn-primary" href="/">Volver al inicio</a></p>`;

function renderAuthor(author, books) {
  const count = `${books.length} ${books.length === 1 ? 'libro' : 'libros'}`;

  page.innerHTML = `
    <nav aria-label="Migas de pan">
      <ol class="breadcrumb">
        <li><a href="/">Inicio</a></li>
        <li>Autores</li>
        <li aria-current="page">${escapeHtml(author.name)}</li>
      </ol>
    </nav>

    <section class="author-hero">
      <img src="${imgSrc(author.photo)}" alt="Foto de ${escapeHtml(author.name)}" />
      <div>
        <span class="badge">${count} en el catálogo</span>
        <h1>${escapeHtml(author.name)}</h1>
        <p>${escapeHtml(author.bio || 'Sin biografía disponible.')}</p>
      </div>
    </section>

    <section aria-labelledby="books-title">
      <div class="section-header">
        <h2 id="books-title">Libros de ${escapeHtml(author.name)}</h2>
      </div>
      ${
        books.length
          ? `<div class="book-grid">${books.map(bookCardHtml).join('')}</div>`
          : emptyHtml('Este autor todavía no tiene libros en el catálogo.')
      }
    </section>`;

  document.title = `${author.name} · Biblioteca`;
}

async function init() {
  const id = getIdFromUrl();
  if (!id) {
    page.innerHTML = notFoundHtml;
    return;
  }

  page.innerHTML = loadingHtml('Cargando autor…');
  try {
    const [author, books] = await Promise.all([api.getAuthor(id), api.getAuthorBooks(id)]);
    renderAuthor(author, books);
  } catch (err) {
    page.innerHTML = err.message === 'Autor no encontrado' ? notFoundHtml : errorHtml(err.message);
  }
}

init();
