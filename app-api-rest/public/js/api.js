// Funciones para consumir la API REST de la biblioteca.
// Todas devuelven una promesa con los datos o lanzan un Error con el mensaje de la API.

const API_URL = '/api';
const TOKEN_KEY = 'library_token';

// ---------- Sesión (token guardado en localStorage) ----------
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
export const isLoggedIn = () => Boolean(getToken());

// Envía al login y, después de iniciar sesión, vuelve a la página actual
export function redirectToLogin() {
  const next = location.pathname + location.search + location.hash;
  location.href = `/login.html?next=${encodeURIComponent(next)}`;
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res;
  try {
    res = await fetch(API_URL + path, { ...options, headers });
  } catch {
    throw new Error('No se pudo conectar con el servidor');
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  // Sesión vencida o inválida: se limpia el token y se pide iniciar sesión de nuevo
  if (res.status === 401 && path !== '/auth/login' && !location.pathname.endsWith('/login.html')) {
    clearToken();
    redirectToLogin();
  }

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
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false);
  const qs = new URLSearchParams(entries).toString();
  return qs ? `?${qs}` : '';
}

// ---------- Autenticación ----------
export async function login(username, password) {
  const data = await request('/auth/login', sendJson('POST', { username, password }));
  setToken(data.token);
  return data.user;
}

export const getMe = () => request('/auth/me');

export function logout() {
  clearToken();
  location.href = '/login.html';
}

// ---------- Libros ----------
// params: { search, category, author, available }  → arreglo con todos los libros
export const getBooks = (params) => request(`/books${queryString(params)}`);
// params: { ...filtros, page, limit }  → { data, pagination: { page, limit, total, totalPages } }
export const getBooksPage = (params) => request(`/books${queryString({ page: 1, ...params })}`);
export const getBook = (id) => request(`/books/${id}`);
// data: FormData con title, description, author_id, category_id, copies, image (URL o archivo) y gallery (archivos)
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

// ---------- Préstamos (requieren sesión) ----------
// params: { status: 'active' | 'overdue' | 'returned', book }
export const getLoans = (params) => request(`/loans${queryString(params)}`);
// data: { book_id, borrower_name, borrower_email, due_date: 'AAAA-MM-DD' }
export const createLoan = (data) => request('/loans', sendJson('POST', data));
export const returnLoan = (id) => request(`/loans/${id}/return`, { method: 'PUT' });
export const deleteLoan = (id) => request(`/loans/${id}`, { method: 'DELETE' });
