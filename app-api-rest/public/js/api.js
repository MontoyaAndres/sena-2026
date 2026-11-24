// Funciones para consumir la API REST de la biblioteca.
// Todas devuelven una promesa con los datos o lanzan un Error con el mensaje de la API.

const API_URL = '/api';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(API_URL + path, options);
  } catch {
    throw new Error('No se pudo conectar con el servidor');
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}

const sendJson = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// Construye "?a=1&b=2" ignorando los valores vacíos
function queryString(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  const qs = new URLSearchParams(entries).toString();
  return qs ? `?${qs}` : '';
}

// ---------- Libros ----------
// params: { search, category, author }
export const getBooks = (params) => request(`/books${queryString(params)}`);
export const getBook = (id) => request(`/books/${id}`);
// data: FormData con title, description, author_id, category_id, image (URL o archivo) y gallery (archivos)
export const createBook = (data) => request('/books', { method: 'POST', body: data });
export const updateBook = (id, data) => request(`/books/${id}`, { method: 'PUT', body: data });
export const deleteBook = (id) => request(`/books/${id}`, { method: 'DELETE' });
export const deleteBookImage = (bookId, imageId) =>
  request(`/books/${bookId}/images/${imageId}`, { method: 'DELETE' });

// ---------- Autores ----------
export const getAuthors = () => request('/authors');
export const getAuthor = (id) => request(`/authors/${id}`);
export const getAuthorBooks = (id) => request(`/authors/${id}/books`);
// data: FormData con name, bio y photo (URL o archivo)
export const createAuthor = (data) => request('/authors', { method: 'POST', body: data });
export const updateAuthor = (id, data) => request(`/authors/${id}`, { method: 'PUT', body: data });
export const deleteAuthor = (id) => request(`/authors/${id}`, { method: 'DELETE' });

// ---------- Categorías ----------
export const getCategories = () => request('/categories');
export const createCategory = (name) => request('/categories', sendJson('POST', { name }));
export const updateCategory = (id, name) => request(`/categories/${id}`, sendJson('PUT', { name }));
export const deleteCategory = (id) => request(`/categories/${id}`, { method: 'DELETE' });
