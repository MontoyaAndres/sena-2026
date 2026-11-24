const db = require('../db/database');
const { HttpError } = require('../middlewares/errorHandler');
const { parseId, requiredText } = require('../utils/validate');

function findCategory(id) {
  const category = db
    .prepare(`SELECT c.id, c.name,
                     (SELECT COUNT(*) FROM books b WHERE b.category_id = c.id) AS book_count
              FROM categories c WHERE c.id = ?`)
    .get(id);
  if (!category) throw new HttpError(404, 'Categoría no encontrada');
  return category;
}

// GET /api/categories
function list(req, res) {
  const categories = db
    .prepare(`SELECT c.id, c.name, COUNT(b.id) AS book_count
              FROM categories c LEFT JOIN books b ON b.category_id = c.id
              GROUP BY c.id ORDER BY c.name COLLATE NOCASE`)
    .all();
  res.json(categories);
}

// GET /api/categories/:id
function getById(req, res) {
  res.json(findCategory(parseId(req.params.id)));
}

// POST /api/categories
function create(req, res) {
  const name = requiredText(req.body?.name, 'name', 100);
  const { lastInsertRowid } = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
  res.status(201).json(findCategory(lastInsertRowid));
}

// PUT /api/categories/:id
function update(req, res) {
  const id = parseId(req.params.id);
  findCategory(id);
  const name = requiredText(req.body?.name, 'name', 100);
  db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
  res.json(findCategory(id));
}

// DELETE /api/categories/:id  (no se permite si tiene libros)
function remove(req, res) {
  const id = parseId(req.params.id);
  const category = findCategory(id);
  if (category.book_count > 0) {
    throw new HttpError(400, `No se puede eliminar: la categoría tiene ${category.book_count} libro(s) asociados`);
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.status(204).end();
}

module.exports = { list, getById, create, update, remove };
