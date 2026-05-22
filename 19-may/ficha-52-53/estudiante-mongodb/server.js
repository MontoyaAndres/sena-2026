const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
const PORT = 3000;

// ── ⚠️ PON AQUÍ LA CONTRASEÑA REAL QUE CREASTE EN MONGODB ATLAS ──────
const MONGO_URI =
  "mongodb+srv://andres_bd_user:SENA2026@ferrematerialesjg.hentr34.mongodb.net/?appName=ferrematerialesjg";
// ─────────────────────────────────────────────────────────────────────

// ── Conexión a MongoDB Atlas (NoSQL) ────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch((err) => {
    console.error("❌ No se pudo conectar a MongoDB Atlas:", err.message);
    console.error("   Verifica: 1) La contraseña  2) Network Access en Atlas");
  });

// ── Middleware ───────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname))); // sirve HTML, CSS, imágenes

// ============================================================
//  ESQUEMAS — Estructura de los documentos NoSQL
// ============================================================

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  correo: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true },
  rol: { type: String, enum: ["admin", "cliente"], default: "cliente" },
  fechaRegistro: { type: Date, default: Date.now },
  activo: { type: Boolean, default: true },
});

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  precio: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  categoriaId: { type: Number },
  marca: { type: String, trim: true },
});

const clienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  telefono: { type: String, trim: true },
  correo: { type: String, lowercase: true, trim: true },
  direccion: { type: String, trim: true },
});

const pedidoSchema = new mongoose.Schema({
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente" },
  fecha: { type: Date, default: Date.now },
  estado: {
    type: String,
    enum: ["Pendiente", "Entregado", "Cancelado"],
    default: "Pendiente",
  },
  productos: [{ productoId: Number, cantidad: Number, precioUnitario: Number }],
  total: { type: Number, min: 0 },
});

const Usuario = mongoose.model("Usuario", usuarioSchema);
const Producto = mongoose.model("Producto", productoSchema);
const Cliente = mongoose.model("Cliente", clienteSchema);
const Pedido = mongoose.model("Pedido", pedidoSchema);

// ============================================================
//  RUTAS — Páginas HTML
// ============================================================
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "inicio.html")));
app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "login.html")),
);
app.get("/registro", (req, res) =>
  res.sendFile(path.join(__dirname, "registrer.html")),
);

// ============================================================
//  API — USUARIOS
// ============================================================

// POST /api/registro
app.post("/api/registro", async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;
    if (!nombre || !correo || !password)
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios." });

    const existe = await Usuario.findOne({ correo: correo.toLowerCase() });
    if (existe)
      return res.status(400).json({ error: "El correo ya está registrado." });

    const hash = await bcrypt.hash(password, 10);
    const usuario = new Usuario({ nombre, correo, password: hash });
    await usuario.save();

    res
      .status(201)
      .json({ mensaje: "¡Registro exitoso!", nombre: usuario.nombre });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al registrar.", detalle: err.message });
  }
});

// POST /api/login
app.post("/api/login", async (req, res) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password)
      return res
        .status(400)
        .json({ error: "Correo y contraseña son obligatorios." });

    const usuario = await Usuario.findOne({
      correo: correo.toLowerCase(),
      activo: true,
    });
    if (!usuario)
      return res
        .status(401)
        .json({ error: "Correo o contraseña incorrectos." });

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido)
      return res
        .status(401)
        .json({ error: "Correo o contraseña incorrectos." });

    res.json({
      mensaje: "Login exitoso.",
      nombre: usuario.nombre,
      rol: usuario.rol,
      id: usuario._id,
    });
  } catch (err) {
    res.status(500).json({ error: "Error en el login.", detalle: err.message });
  }
});

// GET /api/usuarios  (sin contraseña)
app.get("/api/usuarios", async (req, res) => {
  try {
    res.json(await Usuario.find({}, "-password"));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  API — PRODUCTOS (CRUD)
// ============================================================
app.get("/api/productos", async (req, res) => {
  try {
    res.json(await Producto.find());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.get("/api/productos/:id", async (req, res) => {
  try {
    const p = await Producto.findById(req.params.id);
    p ? res.json(p) : res.status(404).json({ error: "No encontrado." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post("/api/productos", async (req, res) => {
  try {
    const p = new Producto(req.body);
    await p.save();
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.put("/api/productos/:id", async (req, res) => {
  try {
    const p = await Producto.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.delete("/api/productos/:id", async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Eliminado." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
//  API — CLIENTES (CRUD)
// ============================================================
app.get("/api/clientes", async (req, res) => {
  try {
    res.json(await Cliente.find());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post("/api/clientes", async (req, res) => {
  try {
    const c = new Cliente(req.body);
    await c.save();
    res.status(201).json(c);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.put("/api/clientes/:id", async (req, res) => {
  try {
    const c = await Cliente.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(c);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.delete("/api/clientes/:id", async (req, res) => {
  try {
    await Cliente.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Eliminado." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
//  API — PEDIDOS (CRUD)
// ============================================================
app.get("/api/pedidos", async (req, res) => {
  try {
    res.json(await Pedido.find());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post("/api/pedidos", async (req, res) => {
  try {
    const p = new Pedido(req.body);
    await p.save();
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.put("/api/pedidos/:id", async (req, res) => {
  try {
    const p = await Pedido.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.delete("/api/pedidos/:id", async (req, res) => {
  try {
    await Pedido.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Eliminado." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Inicia el servidor ───────────────────────────────────────
app.listen(PORT, () => {
  console.log("================================================");
  console.log(`  🚀 Proyecto:   http://localhost:${PORT}`);
  console.log(`  📝 Registro:   POST /api/registro`);
  console.log(`  🔐 Login:      POST /api/login`);
  console.log(`  📦 Productos:  GET  /api/productos`);
  console.log("================================================");
});
