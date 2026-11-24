const db = require('../db/database');
const { HttpError } = require('../middlewares/errorHandler');
const { parseId, requiredText, optionalText, parseDate } = require('../utils/validate');

const TODAY = "date('now', 'localtime')";

const BASE_SELECT = `
  SELECT l.id, l.borrower_name, l.borrower_email, l.loan_date, l.due_date, l.returned_at,
         b.id AS book_id, b.title AS book_title, b.image AS book_image,
         CASE
           WHEN l.returned_at IS NOT NULL THEN 'returned'
           WHEN l.due_date < ${TODAY}     THEN 'overdue'
           ELSE 'active'
         END AS status
  FROM loans l
  JOIN books b ON b.id = l.book_id
`;

const STATUS_FILTERS = {
  active: 'l.returned_at IS NULL', // incluye los vencidos
  overdue: `l.returned_at IS NULL AND l.due_date < ${TODAY}`,
  returned: 'l.returned_at IS NOT NULL',
};

function toLoan(row) {
  const { book_id, book_title, book_image, ...loan } = row;
  return { ...loan, book: { id: book_id, title: book_title, image: book_image } };
}

function findLoan(id) {
  const row = db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(id);
  if (!row) throw new HttpError(404, 'Préstamo no encontrado');
  return toLoan(row);
}

const today = () => db.prepare(`SELECT ${TODAY} AS d`).get().d;

// GET /api/loans?status=active|overdue|returned&book=
function list(req, res) {
  const where = [];
  const params = {};

  const { status } = req.query;
  if (status) {
    if (!STATUS_FILTERS[status]) {
      throw new HttpError(400, 'El campo "status" debe ser active, overdue o returned');
    }
    where.push(STATUS_FILTERS[status]);
  }
  if (req.query.book) {
    where.push('l.book_id = @book');
    params.book = parseId(req.query.book, 'book');
  }

  // Primero los activos (por fecha de devolución) y luego los devueltos (más recientes primero)
  const sql = `${BASE_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY l.returned_at IS NOT NULL, CASE WHEN l.returned_at IS NULL THEN l.due_date END, l.returned_at DESC, l.id DESC`;
  res.json(db.prepare(sql).all(params).map(toLoan));
}

// POST /api/loans  { book_id, borrower_name, borrower_email?, due_date }
function create(req, res) {
  const body = req.body ?? {};
  const data = {
    book_id: parseId(body.book_id, 'book_id'),
    borrower_name: requiredText(body.borrower_name, 'borrower_name', 150),
    borrower_email: optionalText(body.borrower_email, 'borrower_email', 254),
    due_date: parseDate(body.due_date, 'due_date'),
    loan_date: today(),
  };

  if (data.borrower_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.borrower_email)) {
    throw new HttpError(400, 'El campo "borrower_email" no es un correo válido');
  }
  if (data.due_date < data.loan_date) {
    throw new HttpError(400, 'La fecha de devolución no puede ser anterior a hoy');
  }

  const id = db.transaction(() => {
    const book = db
      .prepare(`SELECT b.title, b.copies - (SELECT COUNT(*) FROM loans l WHERE l.book_id = b.id AND l.returned_at IS NULL) AS available
                FROM books b WHERE b.id = ?`)
      .get(data.book_id);
    if (!book) throw new HttpError(400, `El libro con id ${data.book_id} no existe`);
    if (book.available <= 0) throw new HttpError(400, `No hay ejemplares disponibles de "${book.title}"`);

    return db
      .prepare(`INSERT INTO loans (book_id, borrower_name, borrower_email, loan_date, due_date)
                VALUES (@book_id, @borrower_name, @borrower_email, @loan_date, @due_date)`)
      .run(data).lastInsertRowid;
  })();

  res.status(201).json(findLoan(id));
}

// PUT /api/loans/:id/return  (marca el préstamo como devuelto)
function markReturned(req, res) {
  const id = parseId(req.params.id);
  const loan = findLoan(id);
  if (loan.returned_at) throw new HttpError(400, 'Este préstamo ya fue devuelto');

  db.prepare(`UPDATE loans SET returned_at = ${TODAY} WHERE id = ?`).run(id);
  res.json(findLoan(id));
}

// DELETE /api/loans/:id
function remove(req, res) {
  const id = parseId(req.params.id);
  findLoan(id);
  db.prepare('DELETE FROM loans WHERE id = ?').run(id);
  res.status(204).end();
}

module.exports = { list, create, markReturned, remove };
