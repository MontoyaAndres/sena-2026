import './layout.js';
import * as api from './api.js';
import { escapeHtml, imgSrc, bookCardHtml, getIdFromUrl, loadingHtml, emptyHtml, errorHtml } from './ui.js';

const page = document.getElementById('book-page');

const notFoundHtml = `
  ${emptyHtml('No encontramos este libro. Puede que haya sido eliminado.')}
  <p style="text-align:center"><a class="btn btn-primary" href="/">Volver al inicio</a></p>`;

const formatDate = (value) =>
  new Date(value.replace(' ', 'T') + 'Z').toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' });

// ---------- Galería ----------
let images = []; // portada + imágenes de la galería
let currentIndex = 0;

function galleryHtml(book) {
  const thumbs =
    images.length > 1
      ? `<div class="gallery-thumbs">
          ${images
            .map(
              (url, i) => `
              <button class="gallery-thumb" type="button" data-index="${i}" aria-label="Ver imagen ${i + 1} de ${images.length}"
                ${i === 0 ? 'aria-current="true"' : ''}>
                <img src="${imgSrc(url)}" alt="" loading="lazy" />
              </button>`
            )
            .join('')}
        </div>`
      : '';

  return `
    <div class="book-gallery">
      <button class="gallery-main" type="button" aria-label="Ampliar imagen">
        <img id="main-image" src="${imgSrc(images[0])}" alt="Portada de ${escapeHtml(book.title)}" />
      </button>
      ${thumbs}
    </div>`;
}

function showImage(index) {
  currentIndex = (index + images.length) % images.length;
  document.getElementById('main-image').src = imgSrc(images[currentIndex]);
  document.querySelectorAll('.gallery-thumb').forEach((thumb, i) => {
    thumb.setAttribute('aria-current', String(i === currentIndex));
  });
}

// ---------- Visor (lightbox) ----------
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCounter = document.getElementById('lightbox-counter');

function updateLightbox() {
  lightboxImg.src = imgSrc(images[currentIndex]);
  lightboxCounter.textContent = `${currentIndex + 1} / ${images.length}`;
  lightbox.querySelectorAll('[data-step]').forEach((btn) => (btn.hidden = images.length < 2));
}

function openLightbox() {
  updateLightbox();
  lightbox.showModal();
}

function stepLightbox(step) {
  showImage(currentIndex + step);
  updateLightbox();
}

lightbox.addEventListener('click', (e) => {
  const stepBtn = e.target.closest('[data-step]');
  if (stepBtn) return stepLightbox(Number(stepBtn.dataset.step));
  // Cerrar con la X o al hacer clic en el fondo
  if (e.target.closest('.lightbox-close') || e.target === lightbox) lightbox.close();
});

lightbox.addEventListener('keydown', (e) => {
  if (images.length < 2) return;
  if (e.key === 'ArrowLeft') stepLightbox(-1);
  if (e.key === 'ArrowRight') stepLightbox(1);
});

// ---------- Render ----------
function renderBook(book) {
  images = [book.image, ...book.images.map((img) => img.url)].filter(Boolean);
  if (images.length === 0) images = [null]; // muestra el placeholder
  currentIndex = 0;

  const author = book.author;
  const authorUrl = `/author.html?id=${author.id}`;

  page.innerHTML = `
    <nav aria-label="Migas de pan">
      <ol class="breadcrumb">
        <li><a href="/">Inicio</a></li>
        <li><a href="/?category=${book.category.id}#catalogo">${escapeHtml(book.category.name)}</a></li>
        <li aria-current="page">${escapeHtml(book.title)}</li>
      </ol>
    </nav>

    <article class="book-detail">
      ${galleryHtml(book)}

      <div class="book-info">
        <span class="badge">${escapeHtml(book.category.name)}</span>
        <h1>${escapeHtml(book.title)}</h1>
        <p class="book-byline">por <a href="${authorUrl}">${escapeHtml(author.name)}</a></p>

        <p class="book-description">${escapeHtml(book.description || 'Este libro todavía no tiene descripción.')}</p>

        <dl class="meta-list">
          <dt>Autor</dt><dd>${escapeHtml(author.name)}</dd>
          <dt>Categoría</dt><dd>${escapeHtml(book.category.name)}</dd>
          <dt>Imágenes</dt><dd>${images[0] ? images.length : 0}</dd>
          <dt>Agregado</dt><dd>${formatDate(book.created_at)}</dd>
        </dl>

        <aside class="author-card" aria-label="Sobre el autor">
          <img src="${imgSrc(author.photo)}" alt="" loading="lazy" />
          <div>
            <h2>${escapeHtml(author.name)}</h2>
            <p>${escapeHtml(author.bio || 'Sin biografía disponible.')}</p>
            <a class="btn btn-sm btn-outline" href="${authorUrl}">Ver todos sus libros →</a>
          </div>
        </aside>
      </div>
    </article>

    <section class="related" aria-labelledby="related-title">
      <h2 id="related-title">Otros libros de ${escapeHtml(author.name)}</h2>
      <div id="related-books">${loadingHtml()}</div>
    </section>`;

  document.title = `${book.title} · Biblioteca`;

  page.querySelector('.gallery-main').addEventListener('click', openLightbox);
  page.querySelector('.gallery-thumbs')?.addEventListener('click', (e) => {
    const thumb = e.target.closest('[data-index]');
    if (thumb) showImage(Number(thumb.dataset.index));
  });
}

async function loadRelated(book) {
  const container = document.getElementById('related-books');
  try {
    const books = (await api.getAuthorBooks(book.author.id)).filter((b) => b.id !== book.id);
    container.innerHTML = books.length
      ? `<div class="book-grid">${books.map(bookCardHtml).join('')}</div>`
      : emptyHtml('Este es el único libro de este autor en el catálogo.');
  } catch (err) {
    container.innerHTML = errorHtml(err.message);
  }
}

// ---------- Inicio ----------
async function init() {
  const id = getIdFromUrl();
  if (!id) {
    page.innerHTML = notFoundHtml;
    return;
  }

  page.innerHTML = loadingHtml('Cargando libro…');
  try {
    const book = await api.getBook(id);
    renderBook(book);
    loadRelated(book);
  } catch (err) {
    page.innerHTML = err.message === 'Libro no encontrado' ? notFoundHtml : errorHtml(err.message);
  }
}

init();
