const db = require('../db/database');
const { HttpError } = require('../middlewares/errorHandler');
const { publicPath, removeUpload } = require('../middlewares/upload');
const { parseId, parseNonNegativeInt, requiredText, optionalText, optionalImageUrl } = require('../utils/validate');

// Préstamos activos (sin devolver) de un libro
const ACTIVE_LOANS = '(SELECT COUNT(*) FROM loans l WHERE l.book_id = b.id AND l.returned_at IS NULL)';

const FROM = `
  FROM books b
  JOIN authors a    ON a.id = b.author_id
  JOIN categories c ON c.id = b.category_id
`;

const BASE_SELECT = `
  SELECT b.id, b.title, b.description, b.image, b.copies, b.created_at,
         MAX(b.copies - ${ACTIVE_LOANS}, 0) AS available,
         a.id AS author_id, a.name AS author_name,
         c.id AS category_id, c.name AS category_name
  ${FROM}
`;

const MAX_PAGE_SIZE = 50;

// Convierte una fila plana de SQL en un objeto con author y category anidados
function toBook(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image: row.image,
    copies: row.copies,
    available: row.available,
    created_at: row.created_at,
    author: { id: row.author_id, name: row.author_name },
    category: { id: row.category_id, name: row.category_name },
  };
}

function findBook(id) {
  const row = db.prepare(`${BASE_SELECT} WHERE b.id = ?`).get(id);
  if (!row) throw new HttpError(404, 'Libro no encontrado');

  const book = toBook(row);
  book.author = db.prepare('SELECT id, name, bio, photo FROM authors WHERE id = ?').get(row.author_id);
  book.images = db.prepare('SELECT id, url FROM book_images WHERE book_id = ? ORDER BY id').all(id);
  return book;
}

const countActiveLoans = (bookId) =>
  db.prepare('SELECT COUNT(*) AS n FROM loans WHERE book_id = ? AND returned_at IS NULL').get(bookId).n;

function assertExists(table, id, label) {
  if (!db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(id)) {
    throw new HttpError(400, `${label} con id ${id} no existe`);
  }
}

// Valida los datos del libro. `current` son los datos actuales cuando se edita.
function readBookInput(req, current = {}) {
  const body = req.body ?? {};
  const pick = (field) => (body[field] !== undefined ? body[field] : current[field]);

  const data = {
    title: requiredText(pick('title'), 'title'),
    description: optionalText(pick('description'), 'description'),
    author_id: parseId(pick('author_id'), 'author_id'),
    category_id: parseId(pick('category_id'), 'category_id'),
    image: optionalImageUrl(pick('image'), 'image'),
    copies: parseNonNegativeInt(pick('copies') ?? 1, 'copies', 1000),
  };

  assertExists('authors', data.author_id, 'El autor');
  assertExists('categories', data.category_id, 'La categoría');

  // Si se subió un archivo, tiene prioridad sobre la URL
  const file = req.files?.image?.[0];
  if (file) data.image = publicPath(file);

  return data;
}

const insertGallery = (bookId, files = []) => {
  const stmt = db.prepare('INSERT INTO book_images (book_id, url) VALUES (?, ?)');
  for (const f of files) stmt.run(bookId, publicPath(f));
};

// GET /api/books?search=&category=&author=&available=1&page=&limit=
// Sin page/limit devuelve un arreglo con todos los libros.
// Con page o limit devuelve { data, pagination }.
function list(req, res) {
  const where = [];
  const params = {};

  if (req.query.search) {
    where.push('(b.title LIKE @search OR a.name LIKE @search)');
    params.search = `%${req.query.search}%`;
  }
  if (req.query.category) {
    where.push('b.category_id = @category');
    params.category = parseId(req.query.category, 'category');
  }
  if (req.query.author) {
    where.push('b.author_id = @author');
    params.author = parseId(req.query.author, 'author');
  }
  if (req.query.available === '1' || req.query.available === 'true') {
    where.push(`b.copies - ${ACTIVE_LOANS} > 0`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = 'ORDER BY b.title COLLATE NOCASE';

  const paginate = req.query.page !== undefined || req.query.limit !== undefined;
  if (!paginate) {
    res.json(db.prepare(`${BASE_SELECT} ${whereSql} ${orderSql}`).all(params).map(toBook));
    return;
  }

  const page = req.query.page !== undefined ? parseId(req.query.page, 'page') : 1;
  const limit = req.query.limit !== undefined ? parseId(req.query.limit, 'limit') : 12;
  if (limit > MAX_PAGE_SIZE) throw new HttpError(400, `El campo "limit" no puede ser mayor que ${MAX_PAGE_SIZE}`);

  const { total } = db.prepare(`SELECT COUNT(*) AS total ${FROM} ${whereSql}`).get(params);
  const rows = db
    .prepare(`${BASE_SELECT} ${whereSql} ${orderSql} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset: (page - 1) * limit });

  res.json({
    data: rows.map(toBook),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
}

// GET /api/books/:id
function getById(req, res) {
  res.json(findBook(parseId(req.params.id)));
}

// POST /api/books  (JSON o multipart/form-data con "image" y "gallery")
function create(req, res) {
  const data = readBookInput(req);

  const id = db.transaction(() => {
    const { lastInsertRowid } = db
      .prepare(`INSERT INTO books (title, description, image, author_id, category_id, copies)
                VALUES (@title, @description, @image, @author_id, @category_id, @copies)`)
      .run(data);
    insertGallery(lastInsertRowid, req.files?.gallery);
    return lastInsertRowid;
  })();

  res.status(201).json(findBook(id));
}

// PUT /api/books/:id  (los campos que no se envían conservan su valor)
function update(req, res) {
  const id = parseId(req.params.id);
  const current = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
  if (!current) throw new HttpError(404, 'Libro no encontrado');

  const data = readBookInput(req, current);
  const active = countActiveLoans(id);
  if (data.copies < active) {
    throw new HttpError(400, `No puedes dejar ${data.copies} ejemplar(es): hay ${active} prestado(s) en este momento`);
  }

  db.transaction(() => {
    db.prepare(`UPDATE books SET title = @title, description = @description, image = @image,
                author_id = @author_id, category_id = @category_id, copies = @copies WHERE id = @id`).run({ ...data, id });
    insertGallery(id, req.files?.gallery);
  })();

  if (current.image !== data.image) removeUpload(current.image);
  res.json(findBook(id));
}

// DELETE /api/books/:id  (no se permite si tiene préstamos activos)
function remove(req, res) {
  const id = parseId(req.params.id);
  const book = db.prepare('SELECT image FROM books WHERE id = ?').get(id);
  if (!book) throw new HttpError(404, 'Libro no encontrado');

  const active = countActiveLoans(id);
  if (active > 0) {
    throw new HttpError(400, `No se puede eliminar: el libro tiene ${active} préstamo(s) activo(s)`);
  }

  const images = db.prepare('SELECT url FROM book_images WHERE book_id = ?').all(id);
  db.prepare('DELETE FROM books WHERE id = ?').run(id); // imágenes y préstamos devueltos se borran en cascada

  removeUpload(book.image);
  images.forEach((img) => removeUpload(img.url));
  res.status(204).end();
}

// DELETE /api/books/:id/images/:imageId
function removeImage(req, res) {
  const id = parseId(req.params.id);
  const imageId = parseId(req.params.imageId, 'imageId');
  const image = db.prepare('SELECT url FROM book_images WHERE id = ? AND book_id = ?').get(imageId, id);
  if (!image) throw new HttpError(404, 'Imagen no encontrada');

  db.prepare('DELETE FROM book_images WHERE id = ?').run(imageId);
  removeUpload(image.url);
  res.status(204).end();
}

module.exports = { list, getById, create, update, remove, removeImage, toBook, BASE_SELECT };
