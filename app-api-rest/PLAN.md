# 📚 Plan de trabajo — Aplicación de Biblioteca

API REST con **Node.js + Express + SQLite** y un frontend en **HTML, CSS y JavaScript** (sin frameworks) que consume la API.

---

## 🎯 Objetivo

- Página de **inicio** con hero, listado de libros disponibles y footer.
- Página de **detalle de libro** con imagen(es) e información completa.
- Página de **autor** que muestra todos los libros relacionados con ese autor.
- **Panel de administración** con CRUD (crear, leer, editar, eliminar) de libros.

---

## 🧱 Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Servidor | Node.js + Express |
| Base de datos | SQLite (`better-sqlite3` o `sqlite3`) |
| Subida de imágenes | `multer` (opcional; también se puede usar URL de imagen) |
| Utilidades | `cors`, `nodemon` (desarrollo) |
| Frontend | HTML5, CSS3, JavaScript (`fetch`) |

---

## 🗂️ Estructura de carpetas propuesta

```
app-api-rest/
├── package.json
├── PLAN.md
├── src/
│   ├── server.js              # Arranque de Express
│   ├── db/
│   │   ├── database.js        # Conexión a SQLite
│   │   ├── schema.sql         # Creación de tablas
│   │   └── seed.js            # Datos de ejemplo
│   ├── routes/
│   │   ├── books.routes.js
│   │   ├── authors.routes.js
│   │   └── categories.routes.js
│   ├── controllers/
│   │   ├── books.controller.js
│   │   ├── authors.controller.js
│   │   └── categories.controller.js
│   ├── middlewares/
│   │   ├── errorHandler.js
│   │   └── upload.js          # Configuración de multer
│   └── utils/
│       └── validate.js        # Validaciones de los datos de entrada
├── uploads/                   # Imágenes subidas
└── public/                    # Frontend
    ├── index.html             # Inicio (hero + libros + footer)
    ├── book.html              # Detalle de libro
    ├── author.html            # Libros de un autor
    ├── admin.html             # Panel de administración
    ├── css/
    │   └── styles.css
    └── js/
        ├── api.js             # Funciones fetch reutilizables
        ├── ui.js              # Escape de HTML, toasts, confirmación, estados
        ├── layout.js          # Header y footer comunes
        ├── home.js
        ├── book.js
        ├── author.js
        └── admin.js
```

---

## 🗄️ Modelo de datos

```
authors (1) ───< books >─── (1) categories
```

### Tabla `authors`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INTEGER | PK, autoincrement |
| name | TEXT | NOT NULL |
| bio | TEXT | opcional |
| photo | TEXT | URL/ruta, opcional |

### Tabla `categories`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INTEGER | PK, autoincrement |
| name | TEXT | NOT NULL, UNIQUE |

### Tabla `books`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INTEGER | PK, autoincrement |
| title | TEXT | NOT NULL |
| description | TEXT | |
| image | TEXT | URL o ruta en `/uploads` |
| category_id | INTEGER | FK → categories.id |
| author_id | INTEGER | FK → authors.id |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

### Tabla `book_images` (opcional, para galería de varias imágenes)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INTEGER | PK |
| book_id | INTEGER | FK → books.id, ON DELETE CASCADE |
| url | TEXT | NOT NULL |

---

## 🔌 Endpoints de la API

### Libros
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/books` | Listar libros (con autor y categoría). Filtros: `?category=`, `?author=`, `?search=` |
| GET | `/api/books/:id` | Detalle de un libro (incluye autor, categoría e imágenes) |
| POST | `/api/books` | Crear libro |
| PUT | `/api/books/:id` | Editar libro |
| DELETE | `/api/books/:id` | Eliminar libro |
| DELETE | `/api/books/:id/images/:imageId` | Eliminar una imagen de la galería |

> `POST` y `PUT` de libros aceptan JSON (con `image` como URL) o `multipart/form-data` con los archivos `image` (portada) y `gallery` (hasta 6 imágenes). En `PUT`, los campos que no se envían conservan su valor.

### Autores
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/authors` | Listar autores |
| GET | `/api/authors/:id` | Detalle del autor |
| GET | `/api/authors/:id/books` | Libros del autor |
| POST / PUT / DELETE | `/api/authors[/:id]` | CRUD de autores (para el admin) |

### Categorías
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/categories` | Listar categorías |
| POST / PUT / DELETE | `/api/categories[/:id]` | CRUD de categorías (para el admin) |

### Códigos de respuesta esperados
- `200` OK · `201` creado · `204` eliminado · `400` datos inválidos · `404` no encontrado · `409` nombre duplicado · `500` error del servidor

---

## ✅ Tareas

### Fase 0 — Configuración del proyecto
- [x] 0.1 Inicializar el proyecto (`npm init -y`, ya existe `package.json`)
- [x] 0.2 Instalar dependencias: `npm i express better-sqlite3 cors multer`
- [x] 0.3 Instalar dependencias de desarrollo: `npm i -D nodemon`
- [x] 0.4 Agregar scripts en `package.json`: `"start": "node src/server.js"`, `"dev": "nodemon src/server.js"`, `"seed": "node src/db/seed.js"`
- [x] 0.5 Crear `.gitignore` (`node_modules/`, `*.sqlite`, `uploads/*`)
- [x] 0.6 Crear la estructura de carpetas

### Fase 1 — Base de datos (SQLite)
- [x] 1.1 Crear `src/db/database.js` con la conexión a `library.sqlite`
- [x] 1.2 Activar llaves foráneas: `PRAGMA foreign_keys = ON`
- [x] 1.3 Escribir `schema.sql` con las tablas `authors`, `categories`, `books` (y `book_images` si se usa)
- [x] 1.4 Ejecutar el schema al iniciar el servidor (`CREATE TABLE IF NOT EXISTS`)
- [x] 1.5 Crear `seed.js` con datos de ejemplo (≥ 3 autores, ≥ 4 categorías, ≥ 10 libros)
- [x] 1.6 Probar que las tablas se crean y el seed inserta datos

### Fase 2 — Servidor Express
- [x] 2.1 Crear `src/server.js` con Express, `express.json()` y `cors()`
- [x] 2.2 Servir el frontend estático: `express.static('public')`
- [x] 2.3 Servir imágenes: `express.static('uploads')` en `/uploads`
- [x] 2.4 Montar rutas bajo `/api`
- [x] 2.5 Middleware de manejo de errores (`errorHandler.js`)
- [x] 2.6 Middleware para rutas no encontradas (404 en JSON)

### Fase 3 — API de libros
- [x] 3.1 `GET /api/books` con `JOIN` a autores y categorías
- [x] 3.2 Filtros opcionales por categoría y búsqueda por título
- [x] 3.3 `GET /api/books/:id` (404 si no existe)
- [x] 3.4 `POST /api/books` con validación (título, autor y categoría obligatorios)
- [x] 3.5 `PUT /api/books/:id`
- [x] 3.6 `DELETE /api/books/:id`
- [x] 3.7 Subida de imagen con `multer` (o aceptar URL de imagen)
- [x] 3.8 Probar todos los endpoints con Thunder Client / Postman

### Fase 4 — API de autores y categorías
- [x] 4.1 `GET /api/authors` y `GET /api/authors/:id`
- [x] 4.2 `GET /api/authors/:id/books` (libros relacionados del autor)
- [x] 4.3 CRUD de autores (POST, PUT, DELETE)
- [x] 4.4 `GET /api/categories`
- [x] 4.5 CRUD de categorías
- [x] 4.6 Definir qué pasa al eliminar un autor/categoría con libros (bloquear con `400` o `ON DELETE` adecuado)
- [x] 4.7 Probar endpoints

### Fase 5 — Frontend: base y estilos
- [x] 5.1 Crear `styles.css` con variables (colores, tipografía, espaciados)
- [x] 5.2 Crear header/navbar común (Inicio, Admin)
- [x] 5.3 Crear footer común
- [x] 5.4 Crear `js/api.js` con funciones: `getBooks()`, `getBook(id)`, `getAuthor(id)`, `getAuthorBooks(id)`, `createBook()`, `updateBook()`, `deleteBook()`
- [x] 5.5 Diseño responsive (mobile first, grid de tarjetas)

### Fase 6 — Página de inicio (`index.html`)
- [x] 6.1 Sección **hero** (título, subtítulo, imagen de fondo, botón "Ver libros")
- [x] 6.2 Sección de **libros disponibles** en tarjetas (imagen, título, autor, categoría)
- [x] 6.3 Cargar libros desde `GET /api/books`
- [x] 6.4 Filtro por categoría y buscador por título
- [x] 6.5 Clic en la tarjeta → `book.html?id=X`
- [x] 6.6 Clic en el nombre del autor → `author.html?id=Y`
- [x] 6.7 Estados de carga, vacío y error
- [x] 6.8 **Footer** (información de la biblioteca, enlaces, derechos)

### Fase 7 — Detalle de libro (`book.html`)
- [x] 7.1 Leer `id` de la URL (`URLSearchParams`)
- [x] 7.2 Consumir `GET /api/books/:id`
- [x] 7.3 Mostrar imagen principal y galería de imágenes (si hay `book_images`)
- [x] 7.4 Mostrar título, descripción, categoría y autor
- [x] 7.5 Enlace al autor → `author.html?id=Y`
- [x] 7.6 Sección "Otros libros del autor"
- [x] 7.7 Mensaje si el libro no existe (404)

### Fase 8 — Página de autor (`author.html`)
- [x] 8.1 Leer `id` de la URL
- [x] 8.2 Consumir `GET /api/authors/:id` y `GET /api/authors/:id/books`
- [x] 8.3 Mostrar nombre, foto y biografía del autor
- [x] 8.4 Listar sus libros en tarjetas (clic → detalle)

### Fase 9 — Panel de administración (`admin.html`)
- [x] 9.1 Tabla con todos los libros (imagen, título, autor, categoría, acciones)
- [x] 9.2 Formulario para **crear** libro (título, descripción, imagen, categoría, autor)
- [x] 9.3 Selects de autor y categoría cargados desde la API
- [x] 9.4 Botón **editar**: cargar datos en el formulario y enviar `PUT`
- [x] 9.5 Botón **eliminar** con confirmación y `DELETE`
- [x] 9.6 Vista previa de la imagen antes de guardar
- [x] 9.7 Validaciones en el formulario (campos obligatorios)
- [x] 9.8 Mensajes de éxito/error y refrescar la tabla tras cada acción
- [x] 9.9 (Opcional) Pestañas para gestionar autores y categorías

### Fase 10 — Pruebas y cierre
- [ ] 10.1 Probar flujo completo: crear → ver en inicio → ver detalle → ver autor → editar → eliminar
- [ ] 10.2 Revisar responsive en móvil, tablet y escritorio
- [ ] 10.3 Revisar errores en la consola del navegador y del servidor
- [ ] 10.4 Escribir `README.md` (instalación, cómo correr, endpoints)
- [ ] 10.5 Commit final

### Extras (opcionales)
- [ ] E.1 Login básico para proteger el panel de administración
- [ ] E.2 Paginación en `GET /api/books`
- [ ] E.3 Campo `available` / préstamos de libros
- [ ] E.4 Dockerizar la aplicación (`Dockerfile` + `docker-compose.yml`)

---

## 🚀 Cómo ejecutar (cuando esté listo)

```bash
npm install
npm run seed
npm run dev
# Abrir http://localhost:3000
```
