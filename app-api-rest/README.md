# 📚 Biblioteca — API REST + Frontend

Aplicación para una biblioteca: una **API REST** con **Node.js, Express y SQLite** y un **frontend en HTML, CSS y JavaScript** (sin frameworks) que la consume.

- **Inicio**: hero, catálogo con búsqueda, filtro por categoría, "solo disponibles" y paginación.
- **Detalle de libro**: galería de imágenes con visor a pantalla completa, disponibilidad y otros libros del autor.
- **Página de autor**: biografía y todos sus libros.
- **Panel de administración** (con login): CRUD de libros, autores y categorías, y gestión de préstamos.

---

## 🚀 Cómo ejecutarlo

Requisitos: **Node.js 22 o superior** (probado con Node 24).

```bash
npm install
cp .env.example .env     # opcional: cambia la contraseña del admin y AUTH_SECRET
npm run seed             # carga datos de ejemplo
npm run dev              # servidor con recarga automática
```

Abre **http://localhost:3000**. El panel está en **http://localhost:3000/admin.html**.

### Acceso al panel de administración

La primera vez que arranca el servidor se crea el usuario administrador con `ADMIN_USER` y `ADMIN_PASSWORD` del archivo `.env`. Si no defines `ADMIN_PASSWORD`, se usa `admin123` y el servidor muestra un aviso: **cámbiala antes de publicar la app**.

Para cambiar la contraseña (o crear otro administrador):

```bash
npm run set-password -- admin miNuevaContraseña
```

### Scripts

| Script | Qué hace |
|--------|----------|
| `npm run dev` | Inicia el servidor con `nodemon` (se reinicia al guardar cambios) |
| `npm start` | Inicia el servidor (producción) |
| `npm run seed` | Borra libros, autores, categorías y préstamos y carga datos de ejemplo. **No** borra los usuarios |
| `npm run set-password -- <usuario> <contraseña>` | Crea un administrador o cambia su contraseña |

### Variables de entorno

Se leen del archivo `.env` (ver `.env.example`) o del entorno.

| Variable | Por defecto | Descripción |
|----------|-------------|-------------|
| `PORT` | `3000` | Puerto del servidor |
| `DB_PATH` | `./library.sqlite` | Archivo de la base de datos |
| `UPLOADS_DIR` | `./uploads` | Carpeta de las imágenes subidas |
| `AUTH_SECRET` | aleatorio en cada arranque | Secreto para firmar los tokens. Si no se define, las sesiones se cierran al reiniciar |
| `TOKEN_TTL_HOURS` | `8` | Duración de la sesión |
| `ADMIN_USER` | `admin` | Usuario administrador inicial |
| `ADMIN_PASSWORD` | `admin123` | Contraseña inicial (solo se usa si no existe ningún usuario) |

---

## 🐳 Docker

```bash
docker compose up -d --build
docker compose exec app npm run seed      # datos de ejemplo (opcional)
```

La app queda en **http://localhost:3000**. La base de datos y las imágenes se guardan en los volúmenes `library-data` y `library-uploads`, así que no se pierden al reiniciar o reconstruir el contenedor. Si existe un archivo `.env`, Compose lo usa.

```bash
docker compose logs -f app   # ver los logs
docker compose down          # detener (los datos se conservan)
docker compose down -v       # detener y BORRAR los datos
```

---

## 🗂️ Estructura

```
app-api-rest/
├── src/
│   ├── server.js                 # Arranque de Express
│   ├── config.js                 # Variables de entorno y .env
│   ├── db/
│   │   ├── database.js           # Conexión a SQLite y migraciones
│   │   ├── schema.sql            # Tablas
│   │   ├── seed.js               # Datos de ejemplo
│   │   └── set-password.js       # Crear/cambiar administrador
│   ├── routes/                   # Rutas de cada recurso
│   ├── controllers/              # Lógica de cada recurso
│   ├── middlewares/
│   │   ├── auth.js               # requireAuth y límite de intentos de login
│   │   ├── errorHandler.js       # Errores en JSON
│   │   └── upload.js             # Subida de imágenes (multer)
│   ├── services/auth.js          # Hash de contraseñas y tokens
│   └── utils/validate.js         # Validaciones
├── public/                       # Frontend
│   ├── index.html · book.html · author.html · admin.html · login.html
│   ├── css/styles.css
│   └── js/                       # api.js, ui.js, layout.js y un archivo por página
├── uploads/                      # Imágenes subidas
├── Dockerfile · docker-compose.yml
└── PLAN.md                       # Plan de trabajo por fases
```

---

## 🗄️ Modelo de datos

```
authors 1 ──< books >── 1 categories
               │
               ├──< book_images   (galería)
               └──< loans         (préstamos)

users  (administradores)
```

- **books.copies**: ejemplares físicos. Los **disponibles** son `copies - préstamos activos`.
- **loans**: un préstamo está activo mientras `returned_at` sea `NULL`, y vencido si además `due_date` ya pasó.
- No se puede borrar un autor o una categoría con libros, ni un libro con préstamos activos.

---

## 🔌 API

Todas las respuestas son JSON. Los errores tienen la forma `{ "error": "mensaje" }`.

**Autenticación:** las rutas marcadas con 🔒 requieren el header `Authorization: Bearer <token>`. El token se obtiene en `POST /api/auth/login`.

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | `{ username, password }` → `{ token, expiresAt, user }`. Máximo 5 intentos fallidos cada 15 min |
| GET | `/api/auth/me` 🔒 | Usuario de la sesión actual |

### Libros
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/books` | Lista de libros. Filtros: `search`, `category`, `author`, `available=1` |
| GET | `/api/books?page=1&limit=12` | Lo mismo, paginado → `{ data, pagination: { page, limit, total, totalPages } }` (máx. 50 por página) |
| GET | `/api/books/:id` | Detalle con autor, categoría, imágenes, `copies` y `available` |
| POST | `/api/books` 🔒 | Crear libro |
| PUT | `/api/books/:id` 🔒 | Editar libro (los campos que no se envían conservan su valor) |
| DELETE | `/api/books/:id` 🔒 | Eliminar libro |
| DELETE | `/api/books/:id/images/:imageId` 🔒 | Eliminar una imagen de la galería |

`POST`/`PUT` aceptan JSON o `multipart/form-data`. Campos: `title`*, `author_id`*, `category_id`*, `description`, `copies` (0–1000, por defecto 1) e `image` (URL o archivo). En multipart también `gallery` (hasta 6 imágenes). Imágenes: JPG, PNG, WEBP o GIF de máximo 5 MB.

### Autores
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/authors` | Lista con `book_count` |
| GET | `/api/authors/:id` | Detalle |
| GET | `/api/authors/:id/books` | Libros del autor |
| POST · PUT `/:id` · DELETE `/:id` | `/api/authors` 🔒 | CRUD. Campos: `name`*, `bio`, `photo` (URL o archivo) |

### Categorías
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/categories` | Lista con `book_count` |
| GET | `/api/categories/:id` | Detalle |
| POST · PUT `/:id` · DELETE `/:id` | `/api/categories` 🔒 | CRUD. Campo: `name`* (único) |

### Préstamos 🔒
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/loans` | Lista. Filtros: `status=active\|overdue\|returned`, `book` |
| POST | `/api/loans` | `{ book_id, borrower_name, borrower_email?, due_date: "AAAA-MM-DD" }`. Falla si no hay ejemplares |
| PUT | `/api/loans/:id/return` | Marcar como devuelto |
| DELETE | `/api/loans/:id` | Eliminar el registro |

### Códigos de respuesta
`200` OK · `201` creado · `204` eliminado · `400` datos inválidos · `401` sin sesión · `404` no encontrado · `409` nombre duplicado · `429` demasiados intentos · `500` error del servidor

### Ejemplo con `curl`

```bash
# Iniciar sesión
TOKEN=$(curl -s -X POST localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# Crear un libro con portada
curl -X POST localhost:3000/api/books -H "Authorization: Bearer $TOKEN" \
  -F title="Pedro Páramo" -F author_id=1 -F category_id=1 -F copies=2 -F image=@portada.jpg
```

---

## 🔐 Seguridad (lo que incluye y lo que no)

- Contraseñas guardadas con **scrypt** y sal; tokens firmados con **HMAC-SHA256** que vencen.
- Límite de intentos de login por IP.
- Todo el texto se escapa antes de mostrarse en el navegador; las URLs de imagen solo aceptan `http(s)://` o `/uploads/`.
- Solo se aceptan imágenes de hasta 5 MB.
- El token se guarda en `localStorage`: es simple y suficiente para un proyecto de clase, pero en producción conviene usar cookies `HttpOnly` y HTTPS.
