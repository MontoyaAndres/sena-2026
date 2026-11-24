// Llena la base de datos con datos de ejemplo.
// Ejecutar con: npm run seed  (borra los datos existentes)
const db = require('./database');

// Imágenes de ejemplo (placeholders); en el panel de administración se pueden cambiar
const img = (seed, w = 400, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const authors = [
  {
    name: 'Gabriel García Márquez',
    bio: 'Escritor colombiano, Premio Nobel de Literatura en 1982 y figura central del realismo mágico.',
    photo: img('ggm', 300, 300),
  },
  {
    name: 'Isabel Allende',
    bio: 'Escritora chilena, una de las novelistas en español más leídas del mundo.',
    photo: img('allende', 300, 300),
  },
  {
    name: 'Jorge Luis Borges',
    bio: 'Escritor argentino, maestro del cuento, el ensayo y la poesía.',
    photo: img('borges', 300, 300),
  },
  {
    name: 'Julio Cortázar',
    bio: 'Escritor argentino, autor de novelas y cuentos que rompieron con la narrativa tradicional.',
    photo: img('cortazar', 300, 300),
  },
];

const categories = ['Novela', 'Cuento', 'Poesía', 'Ensayo'];

// author y category hacen referencia al nombre para que el seed sea fácil de leer
const books = [
  {
    title: 'Cien años de soledad',
    description: 'La historia de la familia Buendía a lo largo de siete generaciones en el pueblo de Macondo.',
    author: 'Gabriel García Márquez',
    category: 'Novela',
  },
  {
    title: 'El amor en los tiempos del cólera',
    description: 'Florentino Ariza espera más de cincuenta años para declarar de nuevo su amor a Fermina Daza.',
    author: 'Gabriel García Márquez',
    category: 'Novela',
  },
  {
    title: 'Crónica de una muerte anunciada',
    description: 'La reconstrucción del asesinato de Santiago Nasar, una muerte que todo el pueblo sabía que iba a ocurrir.',
    author: 'Gabriel García Márquez',
    category: 'Novela',
  },
  {
    title: 'Doce cuentos peregrinos',
    description: 'Doce relatos sobre latinoamericanos que viven en Europa.',
    author: 'Gabriel García Márquez',
    category: 'Cuento',
  },
  {
    title: 'La casa de los espíritus',
    description: 'La saga de la familia Trueba a lo largo de cuatro generaciones en un país latinoamericano.',
    author: 'Isabel Allende',
    category: 'Novela',
  },
  {
    title: 'Eva Luna',
    description: 'Una narradora huérfana que sobrevive gracias a su talento para contar historias.',
    author: 'Isabel Allende',
    category: 'Novela',
  },
  {
    title: 'Cuentos de Eva Luna',
    description: 'Veintitrés relatos que Eva Luna le cuenta a su amante.',
    author: 'Isabel Allende',
    category: 'Cuento',
  },
  {
    title: 'Ficciones',
    description: 'Colección de cuentos con laberintos, bibliotecas infinitas y espejos.',
    author: 'Jorge Luis Borges',
    category: 'Cuento',
  },
  {
    title: 'El Aleph',
    description: 'Relatos sobre el infinito, la identidad y el tiempo.',
    author: 'Jorge Luis Borges',
    category: 'Cuento',
  },
  {
    title: 'El hacedor',
    description: 'Libro que reúne poemas y textos breves en prosa.',
    author: 'Jorge Luis Borges',
    category: 'Poesía',
  },
  {
    title: 'Otras inquisiciones',
    description: 'Ensayos sobre literatura, filosofía y otros autores.',
    author: 'Jorge Luis Borges',
    category: 'Ensayo',
  },
  {
    title: 'Rayuela',
    description: 'Una novela que puede leerse en distintos órdenes, siguiendo a Horacio Oliveira entre París y Buenos Aires.',
    author: 'Julio Cortázar',
    category: 'Novela',
  },
  {
    title: 'Bestiario',
    description: 'Primer libro de cuentos de Cortázar, donde lo fantástico irrumpe en lo cotidiano.',
    author: 'Julio Cortázar',
    category: 'Cuento',
  },
];

const seed = db.transaction(() => {
  // Limpiar en orden por las llaves foráneas
  db.exec(`
    DELETE FROM book_images;
    DELETE FROM books;
    DELETE FROM authors;
    DELETE FROM categories;
    DELETE FROM sqlite_sequence WHERE name IN ('book_images', 'books', 'authors', 'categories');
  `);

  const insertAuthor = db.prepare('INSERT INTO authors (name, bio, photo) VALUES (@name, @bio, @photo)');
  const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const insertBook = db.prepare(`
    INSERT INTO books (title, description, image, category_id, author_id)
    VALUES (@title, @description, @image, @category_id, @author_id)
  `);
  const insertImage = db.prepare('INSERT INTO book_images (book_id, url) VALUES (?, ?)');

  const authorIds = {};
  for (const a of authors) {
    authorIds[a.name] = insertAuthor.run(a).lastInsertRowid;
  }

  const categoryIds = {};
  for (const name of categories) {
    categoryIds[name] = insertCategory.run(name).lastInsertRowid;
  }

  books.forEach((b, i) => {
    const bookId = insertBook.run({
      title: b.title,
      description: b.description,
      image: img(`book-${i + 1}`),
      category_id: categoryIds[b.category],
      author_id: authorIds[b.author],
    }).lastInsertRowid;

    // Dos imágenes extra por libro para la galería del detalle
    insertImage.run(bookId, img(`book-${i + 1}-a`, 800, 600));
    insertImage.run(bookId, img(`book-${i + 1}-b`, 800, 600));
  });
});

seed();

const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
console.log('✅ Seed completado:');
console.log(`   ${count('authors')} autores`);
console.log(`   ${count('categories')} categorías`);
console.log(`   ${count('books')} libros`);
console.log(`   ${count('book_images')} imágenes de galería`);

db.close();
