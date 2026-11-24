-- Autores
CREATE TABLE IF NOT EXISTS authors (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL,
  bio   TEXT,
  photo TEXT
);

-- Categorías
CREATE TABLE IF NOT EXISTS categories (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- Libros
-- ON DELETE RESTRICT: no se puede borrar un autor o una categoría que tenga libros.
CREATE TABLE IF NOT EXISTS books (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT,
  image       TEXT,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  author_id   INTEGER NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Galería de imágenes de cada libro (se borran junto con el libro)
CREATE TABLE IF NOT EXISTS book_images (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  url     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_books_author   ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id);
CREATE INDEX IF NOT EXISTS idx_images_book    ON book_images(book_id);
