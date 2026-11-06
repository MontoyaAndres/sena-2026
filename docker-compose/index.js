const express = require("express");
const { Pool } = require("pg");

// Libreria interna de nodejs
const path = require("path");

const app = express();
const PORT = process.env.PORT;

// Conexion a PostgreSQL usando las variables de entorno del docker-compose
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.use(express.json());
// Sirve la pagina web que esta en la carpeta public
app.use(express.static(path.join(__dirname, "public")));

const CAMPOS = ["nombre", "talla", "color", "tipo", "marca", "precio"];

// IVA del 5% que se aplica a cada producto
const IVA = 0.05;

// Redondea a 2 decimales para evitar errores como 0.1 + 0.2 = 0.30000000000000004
function redondear(valor) {
  return Math.round(valor * 100) / 100;
}

// Agrega subtotal, iva y total a un producto.
// El precio guardado en la base de datos es el precio SIN IVA (subtotal).
function conIva(producto) {
  const subtotal = Number(producto.precio);
  const iva = redondear(subtotal * IVA);
  return {
    ...producto,
    subtotal,
    iva,
    total: redondear(subtotal + iva),
  };
}

// Valida que lleguen todos los campos y que el precio sea un numero valido
function validarProducto(body) {
  for (const campo of CAMPOS) {
    if (body[campo] === undefined || String(body[campo]).trim() === "") {
      return `El campo "${campo}" es obligatorio`;
    }
  }
  const precio = Number(body.precio);
  if (Number.isNaN(precio) || precio < 0) {
    return "El precio debe ser un numero mayor o igual a 0";
  }
  return null;
}

// READ - listar todos los productos (con busqueda opcional ?q=texto)
app.get("/api/productos", async (req, res) => {
  try {
    const q = req.query.q;
    let result;
    if (q) {
      result = await pool.query(
        `SELECT * FROM productos
         WHERE nombre ILIKE $1 OR talla ILIKE $1 OR color ILIKE $1
            OR tipo ILIKE $1 OR marca ILIKE $1
         ORDER BY id`,
        [`%${q}%`],
      );
    } else {
      result = await pool.query("SELECT * FROM productos ORDER BY id");
    }
    res.json(result.rows.map(conIva));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener los productos" });
  }
});

// READ - obtener un producto por id
app.get("/api/productos/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM productos WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json(conIva(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener el producto" });
  }
});

// CREATE - crear un producto
app.post("/api/productos", async (req, res) => {
  const error = validarProducto(req.body);
  if (error) return res.status(400).json({ error });

  const { nombre, talla, color, tipo, marca, precio } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO productos (nombre, talla, color, tipo, marca, precio)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre, talla, color, tipo, marca, precio],
    );
    res.status(201).json(conIva(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear el producto" });
  }
});

// UPDATE - actualizar un producto
app.put("/api/productos/:id", async (req, res) => {
  const error = validarProducto(req.body);
  if (error) return res.status(400).json({ error });

  const { nombre, talla, color, tipo, marca, precio } = req.body;
  try {
    const result = await pool.query(
      `UPDATE productos
       SET nombre = $1, talla = $2, color = $3, tipo = $4, marca = $5, precio = $6
       WHERE id = $7 RETURNING *`,
      [nombre, talla, color, tipo, marca, precio, req.params.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json(conIva(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el producto" });
  }
});

// DELETE - eliminar un producto
app.delete("/api/productos/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM productos WHERE id = $1 RETURNING *",
      [req.params.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json({ mensaje: "Producto eliminado", producto: conIva(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
