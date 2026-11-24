const db = require('../db/database');
const { HttpError } = require('../middlewares/errorHandler');
const { publicPath, removeUpload } = require('../middlewares/upload');
const { parseId, requiredText, optionalText, optionalImageUrl } = require('../utils/validate');
const { toBook, BASE_SELECT } = require('./books.controller');

function findAuthor(id) {
  const author = db
    .prepare(`SELECT a.id, a.name, a.bio, a.photo,
                     (SELECT COUNT(*) FROM books b WHERE b.author_id = a.id) AS book_count
              FROM authors a WHERE a.id = ?`)
    .get(id);
  if (!author) throw new HttpError(404, 'Autor no encontrado');
  return author;
}

function readAuthorInput(req, current = {}) {
  const body = req.body ?? {};
  const pick = (field) => (body[field] !== undefined ? body[field] : current[field]);

  const data = {
    name: requiredText(pick('name'), 'name'),
    bio: optionalText(pick('bio'), 'bio'),
    photo: optionalImageUrl(pick('photo'), 'photo'),
  };
  if (req.file) data.photo = publicPath(req.file);
  return data;
}

// GET /api/authors
function list(req, res) {
  const authors = db
    .prepare(`SELECT a.id, a.name, a.bio, a.photo, COUNT(b.id) AS book_count
              FROM authors a LEFT JOIN books b ON b.author_id = a.id
              GROUP BY a.id ORDER BY a.name COLLATE NOCASE`)
    .all();
  res.json(authors);
}

// GET /api/authors/:id
function getById(req, res) {
  res.json(findAuthor(parseId(req.params.id)));
}

// GET /api/authors/:id/books
function getBooks(req, res) {
  const id = parseId(req.params.id);
  findAuthor(id); // 404 si no existe
  const rows = db.prepare(`${BASE_SELECT} WHERE b.author_id = ? ORDER BY b.title COLLATE NOCASE`).all(id);
  res.json(rows.map(toBook));
}

// POST /api/authors  (JSON o multipart/form-data con "photo")
function create(req, res) {
  const data = readAuthorInput(req);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO authors (name, bio, photo) VALUES (@name, @bio, @photo)')
    .run(data);
  res.status(201).json(findAuthor(lastInsertRowid));
}

// PUT /api/authors/:id
function update(req, res) {
  const id = parseId(req.params.id);
  const current = db.prepare('SELECT * FROM authors WHERE id = ?').get(id);
  if (!current) throw new HttpError(404, 'Autor no encontrado');

  const data = readAuthorInput(req, current);
  db.prepare('UPDATE authors SET name = @name, bio = @bio, photo = @photo WHERE id = @id').run({ ...data, id });

  if (current.photo !== data.photo) removeUpload(current.photo);
  res.json(findAuthor(id));
}

// DELETE /api/authors/:id  (no se permite si tiene libros)
function remove(req, res) {
  const id = parseId(req.params.id);
  const author = findAuthor(id);
  if (author.book_count > 0) {
    throw new HttpError(400, `No se puede eliminar: el autor tiene ${author.book_count} libro(s) asociados`);
  }
  db.prepare('DELETE FROM authors WHERE id = ?').run(id);
  removeUpload(author.photo);
  res.status(204).end();
}

module.exports = { list, getById, getBooks, create, update, remove };
