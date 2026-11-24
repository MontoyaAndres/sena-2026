import './layout.js';
import * as api from './api.js';
import { escapeHtml, imgSrc, PLACEHOLDER_IMG, toast, confirmDialog, loadingHtml, emptyHtml, errorHtml } from './ui.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB (igual que en el servidor)
const MAX_GALLERY = 6;

const state = {
  books: [],
  authors: [],
  categories: [],
  editingBookId: null,
  editingAuthorId: null,
  editingCategoryId: null,
};

const $ = (selector, root = document) => root.querySelector(selector);

// Fila de tabla que ocupa todas las columnas (para carga, vacío o error)
const fullRow = (cols, html) => `<tr><td colspan="${cols}">${html}</td></tr>`;

/* =========================================================
   Pestañas
   ========================================================= */
const TABS = ['books', 'authors', 'categories'];
const tabButtons = document.querySelectorAll('[role="tab"]');

function selectTab(name) {
  tabButtons.forEach((tab) => {
    const active = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  TABS.forEach((t) => ($(`#panel-${t}`).hidden = t !== name));
  history.replaceState(null, '', `#${name}`);
}

tabButtons.forEach((tab) => tab.addEventListener('click', () => selectTab(tab.dataset.tab)));
selectTab(TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'books');

function updateCounts() {
  for (const key of TABS) $(`[data-count="${key}"]`).textContent = state[key].length;
}

/* =========================================================
   Utilidades de formularios
   ========================================================= */
function showFormError(form, message) {
  const box = $('.form-error', form);
  box.textContent = message;
  box.hidden = false;
  box.scrollIntoView({ block: 'nearest' });
}

function clearFormError(form) {
  $('.form-error', form).hidden = true;
}

function setSaving(form, saving) {
  const btn = $('[type="submit"]', form);
  btn.disabled = saving;
  btn.textContent = saving ? 'Guardando…' : 'Guardar';
}

function validateImageFile(file, label) {
  if (!file) return;
  if (!file.type.startsWith('image/')) throw new Error(`${label}: el archivo debe ser una imagen`);
  if (file.size > MAX_FILE_SIZE) throw new Error(`${label}: "${file.name}" supera los 5 MB`);
}

function validateUrl(value, label) {
  if (value && !/^https?:\/\//i.test(value) && !value.startsWith('/uploads/')) {
    throw new Error(`${label}: la URL debe empezar por http:// o https://`);
  }
}

// Conecta un campo URL + archivo con su imagen de vista previa
function setupImagePicker({ urlInput, fileInput, preview, clearButton }) {
  let objectUrl;

  const update = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    delete preview.dataset.fallback;

    const file = fileInput.files[0];
    if (file) {
      objectUrl = URL.createObjectURL(file);
      preview.src = objectUrl;
    } else {
      preview.src = urlInput.value.trim() || PLACEHOLDER_IMG;
    }
  };

  urlInput.addEventListener('input', update);
  fileInput.addEventListener('change', update);
  clearButton.addEventListener('click', () => {
    urlInput.value = '';
    fileInput.value = '';
    update();
  });
  return update;
}

// Cerrar modales con los botones [data-close]
document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => dialog.close()));
});

/* =========================================================
   Carga de datos
   ========================================================= */
async function loadBooks() {
  state.books = await api.getBooks();
  renderBooks();
}

async function loadAuthors() {
  state.authors = await api.getAuthors();
  renderAuthors();
  fillSelect($('#book-author'), state.authors, 'Selecciona un autor');
}

async function loadCategories() {
  state.categories = await api.getCategories();
  renderCategories();
  fillSelect($('#book-category'), state.categories, 'Selecciona una categoría');
}

// Recarga todo (los contadores de libros por autor/categoría cambian al editar libros)
async function reloadAll() {
  try {
    await Promise.all([loadBooks(), loadAuthors(), loadCategories()]);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    updateCounts();
  }
}

function fillSelect(select, items, placeholder) {
  const current = select.value;
  select.innerHTML =
    `<option value="">${placeholder}</option>` +
    items.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('');
  select.value = current;
}

/* =========================================================
   LIBROS
   ========================================================= */
const booksBody = $('#books-body');
const bookSearch = $('#book-search');
const bookDialog = $('#book-dialog');
const bookForm = $('#book-form');

function renderBooks() {
  const term = bookSearch.value.trim().toLowerCase();
  const books = state.books.filter((b) =>
    [b.title, b.author.name, b.category.name].some((text) => text.toLowerCase().includes(term))
  );

  if (books.length === 0) {
    const msg = state.books.length ? 'Ningún libro coincide con la búsqueda.' : 'Todavía no hay libros. ¡Agrega el primero!';
    booksBody.innerHTML = fullRow(5, emptyHtml(msg));
    return;
  }

  booksBody.innerHTML = books
    .map(
      (b) => `
      <tr>
        <td><img class="thumb" src="${imgSrc(b.image)}" alt="" loading="lazy" /></td>
        <td>
          <div class="cell-title">${escapeHtml(b.title)}</div>
          <div class="cell-sub">${escapeHtml(b.description || 'Sin descripción')}</div>
        </td>
        <td class="hide-sm">${escapeHtml(b.author.name)}</td>
        <td class="hide-sm"><span class="badge">${escapeHtml(b.category.name)}</span></td>
        <td class="actions">
          <a class="btn btn-sm btn-ghost" href="/book.html?id=${b.id}">Ver</a>
          <button class="btn btn-sm btn-outline" type="button" data-action="edit" data-id="${b.id}">Editar</button>
          <button class="btn btn-sm btn-danger" type="button" data-action="delete" data-id="${b.id}">Eliminar</button>
        </td>
      </tr>`
    )
    .join('');
}

bookSearch.addEventListener('input', renderBooks);

booksBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = Number(btn.dataset.id);

  if (btn.dataset.action === 'edit') {
    btn.disabled = true;
    try {
      openBookForm(await api.getBook(id));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  }

  if (btn.dataset.action === 'delete') {
    const book = state.books.find((b) => b.id === id);
    const ok = await confirmDialog(`Se eliminará "${book.title}" y todas sus imágenes. Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      await api.deleteBook(id);
      toast(`"${book.title}" fue eliminado`);
      await reloadAll();
    } catch (err) {
      toast(err.message, 'error');
    }
  }
});

// ---------- Formulario de libro ----------
const updateBookPreview = setupImagePicker({
  urlInput: $('#book-image-url'),
  fileInput: $('#book-image-file'),
  preview: $('#book-image-preview'),
  clearButton: $('#book-image-clear'),
});

const galleryInput = $('#book-gallery');
const galleryNew = $('#book-gallery-new');
const galleryCurrent = $('#book-gallery-current');
let galleryObjectUrls = [];

function renderNewGallery() {
  galleryObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  galleryObjectUrls = [...galleryInput.files].map((f) => URL.createObjectURL(f));
  galleryNew.innerHTML = galleryObjectUrls
    .map((url) => `<div class="gallery-item"><img src="${url}" alt="Nueva imagen" /></div>`)
    .join('');
}

galleryInput.addEventListener('change', renderNewGallery);

function renderCurrentGallery(images) {
  $('#book-gallery-current-group').hidden = images.length === 0;
  galleryCurrent.innerHTML = images
    .map(
      (img) => `
      <div class="gallery-item">
        <img src="${imgSrc(img.url)}" alt="Imagen de la galería" />
        <button class="remove" type="button" data-image-id="${img.id}" aria-label="Eliminar imagen">×</button>
      </div>`
    )
    .join('');
}

galleryCurrent.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-image-id]');
  if (!btn) return;
  btn.disabled = true;
  try {
    await api.deleteBookImage(state.editingBookId, btn.dataset.imageId);
    btn.closest('.gallery-item').remove();
    $('#book-gallery-current-group').hidden = galleryCurrent.children.length === 0;
    toast('Imagen eliminada de la galería');
  } catch (err) {
    btn.disabled = false;
    toast(err.message, 'error');
  }
});

function openBookForm(book = null) {
  state.editingBookId = book?.id ?? null;
  bookForm.reset();
  clearFormError(bookForm);
  setSaving(bookForm, false);
  $('#book-dialog-title').textContent = book ? 'Editar libro' : 'Nuevo libro';

  bookForm.elements.title.value = book?.title ?? '';
  bookForm.elements.description.value = book?.description ?? '';
  bookForm.elements.author_id.value = book?.author.id ?? '';
  bookForm.elements.category_id.value = book?.category.id ?? '';
  bookForm.elements.image.value = book?.image ?? '';

  updateBookPreview();
  renderNewGallery();
  renderCurrentGallery(book?.images ?? []);

  bookDialog.showModal();
  bookForm.elements.title.focus();
}

$('#new-book').addEventListener('click', () => {
  if (state.authors.length === 0 || state.categories.length === 0) {
    toast('Primero crea al menos un autor y una categoría', 'error');
    return;
  }
  openBookForm();
});

// Valida en el navegador y construye el FormData para la API
function buildBookData() {
  const title = bookForm.elements.title.value.trim();
  if (!title) throw new Error('El título es obligatorio');
  if (!bookForm.elements.author_id.value) throw new Error('Selecciona un autor');
  if (!bookForm.elements.category_id.value) throw new Error('Selecciona una categoría');

  const imageUrl = bookForm.elements.image.value.trim();
  const imageFile = bookForm.elements.imageFile.files[0];
  const gallery = [...galleryInput.files];

  if (!imageFile) validateUrl(imageUrl, 'Portada');
  validateImageFile(imageFile, 'Portada');
  if (gallery.length > MAX_GALLERY) throw new Error(`Puedes subir máximo ${MAX_GALLERY} imágenes a la galería por vez`);
  gallery.forEach((f) => validateImageFile(f, 'Galería'));

  const data = new FormData();
  data.append('title', title);
  data.append('description', bookForm.elements.description.value.trim());
  data.append('author_id', bookForm.elements.author_id.value);
  data.append('category_id', bookForm.elements.category_id.value);
  data.append('image', imageFile ?? imageUrl); // archivo o URL (vacío = sin portada)
  gallery.forEach((f) => data.append('gallery', f));
  return data;
}

bookForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFormError(bookForm);

  let data;
  try {
    data = buildBookData();
  } catch (err) {
    showFormError(bookForm, err.message);
    return;
  }

  setSaving(bookForm, true);
  try {
    const editing = state.editingBookId;
    const saved = editing ? await api.updateBook(editing, data) : await api.createBook(data);
    bookDialog.close();
    toast(editing ? `"${saved.title}" fue actualizado` : `"${saved.title}" fue creado`);
    await reloadAll();
  } catch (err) {
    showFormError(bookForm, err.message);
  } finally {
    setSaving(bookForm, false);
  }
});

/* =========================================================
   AUTORES
   ========================================================= */
const authorsBody = $('#authors-body');
const authorDialog = $('#author-dialog');
const authorForm = $('#author-form');

function renderAuthors() {
  if (state.authors.length === 0) {
    authorsBody.innerHTML = fullRow(4, emptyHtml('Todavía no hay autores.'));
    return;
  }

  authorsBody.innerHTML = state.authors
    .map((a) => {
      const locked = a.book_count > 0;
      return `
      <tr>
        <td><img class="avatar" src="${imgSrc(a.photo)}" alt="" loading="lazy" /></td>
        <td>
          <div class="cell-title">${escapeHtml(a.name)}</div>
          <div class="cell-sub">${escapeHtml(a.bio || 'Sin biografía')}</div>
        </td>
        <td class="num">${a.book_count}</td>
        <td class="actions">
          <a class="btn btn-sm btn-ghost" href="/author.html?id=${a.id}">Ver</a>
          <button class="btn btn-sm btn-outline" type="button" data-action="edit" data-id="${a.id}">Editar</button>
          <button class="btn btn-sm btn-danger" type="button" data-action="delete" data-id="${a.id}"
            ${locked ? `disabled title="Tiene ${a.book_count} libro(s) asociados"` : ''}>Eliminar</button>
        </td>
      </tr>`;
    })
    .join('');
}

authorsBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const author = state.authors.find((a) => a.id === Number(btn.dataset.id));

  if (btn.dataset.action === 'edit') openAuthorForm(author);

  if (btn.dataset.action === 'delete') {
    const ok = await confirmDialog(`Se eliminará el autor "${author.name}". Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      await api.deleteAuthor(author.id);
      toast(`"${author.name}" fue eliminado`);
      await reloadAll();
    } catch (err) {
      toast(err.message, 'error');
    }
  }
});

const updateAuthorPreview = setupImagePicker({
  urlInput: $('#author-photo-url'),
  fileInput: $('#author-photo-file'),
  preview: $('#author-photo-preview'),
  clearButton: $('#author-photo-clear'),
});

function openAuthorForm(author = null) {
  state.editingAuthorId = author?.id ?? null;
  authorForm.reset();
  clearFormError(authorForm);
  setSaving(authorForm, false);
  $('#author-dialog-title').textContent = author ? 'Editar autor' : 'Nuevo autor';

  authorForm.elements.name.value = author?.name ?? '';
  authorForm.elements.bio.value = author?.bio ?? '';
  authorForm.elements.photo.value = author?.photo ?? '';
  updateAuthorPreview();

  authorDialog.showModal();
  authorForm.elements.name.focus();
}

$('#new-author').addEventListener('click', () => openAuthorForm());

function buildAuthorData() {
  const name = authorForm.elements.name.value.trim();
  if (!name) throw new Error('El nombre es obligatorio');

  const photoUrl = authorForm.elements.photo.value.trim();
  const photoFile = authorForm.elements.photoFile.files[0];
  if (!photoFile) validateUrl(photoUrl, 'Foto');
  validateImageFile(photoFile, 'Foto');

  const data = new FormData();
  data.append('name', name);
  data.append('bio', authorForm.elements.bio.value.trim());
  data.append('photo', photoFile ?? photoUrl);
  return data;
}

authorForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFormError(authorForm);

  let data;
  try {
    data = buildAuthorData();
  } catch (err) {
    showFormError(authorForm, err.message);
    return;
  }

  setSaving(authorForm, true);
  try {
    const editing = state.editingAuthorId;
    const saved = editing ? await api.updateAuthor(editing, data) : await api.createAuthor(data);
    authorDialog.close();
    toast(editing ? `"${saved.name}" fue actualizado` : `"${saved.name}" fue creado`);
    await reloadAll();
  } catch (err) {
    showFormError(authorForm, err.message);
  } finally {
    setSaving(authorForm, false);
  }
});

/* =========================================================
   CATEGORÍAS (edición en línea)
   ========================================================= */
const categoriesBody = $('#categories-body');
const categoryForm = $('#category-form');

function renderCategories() {
  if (state.categories.length === 0) {
    categoriesBody.innerHTML = fullRow(3, emptyHtml('Todavía no hay categorías.'));
    return;
  }

  categoriesBody.innerHTML = state.categories
    .map((c) => {
      if (c.id === state.editingCategoryId) {
        return `
        <tr>
          <td colspan="2">
            <label class="visually-hidden" for="edit-category-${c.id}">Nombre de la categoría</label>
            <input id="edit-category-${c.id}" class="input" value="${escapeHtml(c.name)}" maxlength="100" data-edit-input />
          </td>
          <td class="actions">
            <button class="btn btn-sm btn-primary" type="button" data-action="save" data-id="${c.id}">Guardar</button>
            <button class="btn btn-sm btn-outline" type="button" data-action="cancel">Cancelar</button>
          </td>
        </tr>`;
      }
      const locked = c.book_count > 0;
      return `
      <tr>
        <td class="cell-title">${escapeHtml(c.name)}</td>
        <td class="num">${c.book_count}</td>
        <td class="actions">
          <button class="btn btn-sm btn-outline" type="button" data-action="edit" data-id="${c.id}">Editar</button>
          <button class="btn btn-sm btn-danger" type="button" data-action="delete" data-id="${c.id}"
            ${locked ? `disabled title="Tiene ${c.book_count} libro(s) asociados"` : ''}>Eliminar</button>
        </td>
      </tr>`;
    })
    .join('');

  const editInput = $('[data-edit-input]', categoriesBody);
  if (editInput) {
    editInput.focus();
    editInput.select();
  }
}

categoryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = categoryForm.elements.name.value.trim();
  if (!name) {
    toast('Escribe el nombre de la categoría', 'error');
    categoryForm.elements.name.focus();
    return;
  }
  try {
    await api.createCategory(name);
    categoryForm.reset();
    toast(`Categoría "${name}" creada`);
    await reloadAll();
  } catch (err) {
    toast(err.message, 'error');
  }
});

async function saveCategory(id) {
  const name = $('[data-edit-input]', categoriesBody).value.trim();
  if (!name) {
    toast('El nombre no puede estar vacío', 'error');
    return;
  }
  try {
    await api.updateCategory(id, name);
    state.editingCategoryId = null;
    toast('Categoría actualizada');
    await reloadAll();
  } catch (err) {
    toast(err.message, 'error');
  }
}

categoriesBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === 'edit') {
    state.editingCategoryId = id;
    renderCategories();
  } else if (action === 'cancel') {
    state.editingCategoryId = null;
    renderCategories();
  } else if (action === 'save') {
    await saveCategory(id);
  } else if (action === 'delete') {
    const category = state.categories.find((c) => c.id === id);
    const ok = await confirmDialog(`Se eliminará la categoría "${category.name}".`);
    if (!ok) return;
    try {
      await api.deleteCategory(id);
      toast(`Categoría "${category.name}" eliminada`);
      await reloadAll();
    } catch (err) {
      toast(err.message, 'error');
    }
  }
});

// Enter guarda y Escape cancela la edición en línea
categoriesBody.addEventListener('keydown', (e) => {
  if (!e.target.matches('[data-edit-input]')) return;
  if (e.key === 'Enter') saveCategory(state.editingCategoryId);
  if (e.key === 'Escape') {
    state.editingCategoryId = null;
    renderCategories();
  }
});

/* =========================================================
   Inicio
   ========================================================= */
booksBody.innerHTML = fullRow(5, loadingHtml('Cargando libros…'));
authorsBody.innerHTML = fullRow(4, loadingHtml('Cargando autores…'));
categoriesBody.innerHTML = fullRow(3, loadingHtml('Cargando categorías…'));

Promise.all([loadBooks(), loadAuthors(), loadCategories()])
  .then(updateCounts)
  .catch((err) => {
    const html = errorHtml(`No se pudieron cargar los datos: ${err.message}`);
    booksBody.innerHTML = fullRow(5, html);
    authorsBody.innerHTML = fullRow(4, html);
    categoriesBody.innerHTML = fullRow(3, html);
  });
