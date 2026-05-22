// ============================================================
//  Base de datos NoSQL - Ferremateriales JG
//  Motor: MongoDB (NoSQL - documentos JSON)
// ============================================================
//
//  CÓMO USAR:
//  1. Instala MongoDB en tu PC: https://www.mongodb.com/try/download/community
//  2. Abre la terminal y escribe:  mongosh
//  3. Dentro de mongosh escribe:   load("db.js")
//  4. Llama las funciones CRUD:    leerProductos()  crearCliente({...})
//
//  O ejecuta directo desde terminal:  mongosh db.js
// ============================================================

db = db.getSiblingDB("ferremateriales_jg");

// ── Limpia colecciones para reiniciar datos de ejemplo ──────
db.categorias.drop();
db.productos.drop();
db.clientes.drop();
db.pedidos.drop();
db.usuarios.drop();       // ← colección NUEVA para login/registro

// ── Crea las colecciones ─────────────────────────────────────
db.createCollection("categorias");
db.createCollection("productos");
db.createCollection("clientes");
db.createCollection("pedidos");
db.createCollection("usuarios");   // ← NUEVA

// ── Índice único en usuarios.correo para evitar duplicados ───
db.usuarios.createIndex({ correo: 1 }, { unique: true });

// ============================================================
//  COLECCIÓN: categorias
// ============================================================
db.categorias.insertMany([
  { _id: 1, nombre: "Cemento y mezclas",    descripcion: "Materiales para preparacion de concreto y mortero" },
  { _id: 2, nombre: "Herramientas manuales",descripcion: "Herramientas basicas para construccion y reparaciones" },
  { _id: 3, nombre: "Tuberia y accesorios", descripcion: "Productos de plomeria para instalaciones de agua" },
  { _id: 4, nombre: "Pinturas",             descripcion: "Pinturas, brochas, rodillos y accesorios" },
  { _id: 5, nombre: "Electricidad",         descripcion: "Cables, tomas, interruptores y materiales electricos" }
]);

// ============================================================
//  COLECCIÓN: productos
// ============================================================
db.productos.insertMany([
  { _id: 1, nombre: "Cemento gris 50kg",        precio: 32000, stock: 80,  categoriaId: 1, marca: "Argos"   },
  { _id: 2, nombre: "Martillo de una 16 oz",    precio: 28000, stock: 25,  categoriaId: 2, marca: "Stanley" },
  { _id: 3, nombre: "Tubo PVC 1/2 pulgada",     precio:  8500, stock: 120, categoriaId: 3, marca: "Pavco"   },
  { _id: 4, nombre: "Pintura blanca 1 galon",   precio: 54000, stock: 40,  categoriaId: 4, marca: "Pintuco" },
  { _id: 5, nombre: "Cable THW calibre 12",     precio:  3200, stock: 200, categoriaId: 5, marca: "Centelsa"},
  { _id: 6, nombre: "Destornillador estrella",  precio: 12000, stock: 35,  categoriaId: 2, marca: "Pretul"  },
  { _id: 7, nombre: "Arena de rio x bulto",     precio:  9000, stock: 60,  categoriaId: 1, marca: "Genérica"}
]);

// ============================================================
//  COLECCIÓN: clientes
// ============================================================
db.clientes.insertMany([
  { _id: 1, nombre: "Laura Gomez",    telefono: "3001234567", correo: "laura@email.com",  direccion: "Calle 10 # 20-30" },
  { _id: 2, nombre: "Carlos Ramirez", telefono: "3109876543", correo: "carlos@email.com", direccion: "Carrera 15 # 8-40" },
  { _id: 3, nombre: "Ana Torres",     telefono: "3201112233", correo: "ana@email.com",    direccion: "Avenida 5 # 12-18" }
]);

// ============================================================
//  COLECCIÓN: pedidos
// ============================================================
db.pedidos.insertMany([
  {
    _id: 1, clienteId: 1, fecha: new Date(), estado: "Pendiente",
    productos: [
      { productoId: 1, cantidad: 2, precioUnitario: 32000 },
      { productoId: 2, cantidad: 1, precioUnitario: 28000 }
    ],
    total: 92000
  },
  {
    _id: 2, clienteId: 3, fecha: new Date(), estado: "Entregado",
    productos: [
      { productoId: 3, cantidad: 4, precioUnitario: 8500 }
    ],
    total: 34000
  }
]);

// ============================================================
//  COLECCIÓN: usuarios   ← NUEVA (para login y registro)
//
//  NOTA DE SEGURIDAD: en producción NUNCA guardes contraseñas
//  en texto plano. Usa bcrypt para cifrarlas (ver server.js).
//  Aquí se usan en texto plano solo para pruebas en mongosh.
// ============================================================
db.usuarios.insertMany([
  {
    _id: 1,
    nombre:    "Administrador",
    correo:    "admin@ferremateriales.com",
    password:  "admin123",          // ← cifrar con bcrypt en producción
    rol:       "admin",
    fechaRegistro: new Date(),
    activo:    true
  },
  {
    _id: 2,
    nombre:    "Laura Gomez",
    correo:    "laura@email.com",
    password:  "laura123",
    rol:       "cliente",
    fechaRegistro: new Date(),
    activo:    true
  }
]);

// ============================================================
//  FUNCIONES CRUD — Categorias
// ============================================================
function crearCategoria(categoria)        { return db.categorias.insertOne(categoria); }
function leerCategorias()                 { return db.categorias.find().toArray(); }
function leerCategoriaPorId(id)           { return db.categorias.findOne({ _id: id }); }
function actualizarCategoria(id, datos)   { return db.categorias.updateOne({ _id: id }, { $set: datos }); }
function eliminarCategoria(id)            { return db.categorias.deleteOne({ _id: id }); }

// ============================================================
//  FUNCIONES CRUD — Productos
// ============================================================
function crearProducto(producto)          { return db.productos.insertOne(producto); }
function leerProductos()                  { return db.productos.find().toArray(); }
function leerProductoPorId(id)            { return db.productos.findOne({ _id: id }); }
function actualizarProducto(id, datos)    { return db.productos.updateOne({ _id: id }, { $set: datos }); }
function eliminarProducto(id)             { return db.productos.deleteOne({ _id: id }); }

function buscarProductosPorCategoria(categoriaId) {
  return db.productos.find({ categoriaId: categoriaId }).toArray();
}
function buscarProductosPorNombre(texto) {
  return db.productos.find({ nombre: { $regex: texto, $options: "i" } }).toArray();
}
function productosConPocoStock(minimo) {
  return db.productos.find({ stock: { $lt: minimo } }).toArray();
}

// ============================================================
//  FUNCIONES CRUD — Clientes
// ============================================================
function crearCliente(cliente)            { return db.clientes.insertOne(cliente); }
function leerClientes()                   { return db.clientes.find().toArray(); }
function leerClientePorId(id)             { return db.clientes.findOne({ _id: id }); }
function actualizarCliente(id, datos)     { return db.clientes.updateOne({ _id: id }, { $set: datos }); }
function eliminarCliente(id)              { return db.clientes.deleteOne({ _id: id }); }

// ============================================================
//  FUNCIONES CRUD — Pedidos
// ============================================================
function crearPedido(pedido)              { return db.pedidos.insertOne(pedido); }
function leerPedidos()                    { return db.pedidos.find().toArray(); }
function leerPedidoPorId(id)              { return db.pedidos.findOne({ _id: id }); }
function actualizarPedido(id, datos)      { return db.pedidos.updateOne({ _id: id }, { $set: datos }); }
function eliminarPedido(id)               { return db.pedidos.deleteOne({ _id: id }); }

function pedidosPorCliente(clienteId) {
  return db.pedidos.find({ clienteId: clienteId }).toArray();
}
function pedidosPorEstado(estado) {
  return db.pedidos.find({ estado: estado }).toArray();
}

// ============================================================
//  FUNCIONES CRUD — Usuarios  ← NUEVAS
// ============================================================
function crearUsuario(usuario) {
  usuario.fechaRegistro = new Date();
  usuario.activo = true;
  return db.usuarios.insertOne(usuario);
}
function leerUsuarios()                   { return db.usuarios.find({}, { password: 0 }).toArray(); } // oculta password
function leerUsuarioPorId(id)             { return db.usuarios.findOne({ _id: id }, { password: 0 }); }
function leerUsuarioPorCorreo(correo)     { return db.usuarios.findOne({ correo: correo }); }
function actualizarUsuario(id, datos)     { return db.usuarios.updateOne({ _id: id }, { $set: datos }); }
function desactivarUsuario(id)            { return db.usuarios.updateOne({ _id: id }, { $set: { activo: false } }); }
function eliminarUsuario(id)              { return db.usuarios.deleteOne({ _id: id }); }

// Simula el login (en producción usa bcrypt en server.js)
function loginUsuario(correo, password) {
  var usuario = db.usuarios.findOne({ correo: correo, password: password, activo: true });
  if (usuario) {
    print("✅ Login exitoso. Bienvenido, " + usuario.nombre);
    return { ok: true, nombre: usuario.nombre, rol: usuario.rol };
  } else {
    print("❌ Correo o contraseña incorrectos.");
    return { ok: false };
  }
}

// ============================================================
//  REPORTE INICIAL
// ============================================================
print("\n═══════════════════════════════════════════════");
print("  Base de datos NoSQL: ferremateriales_jg");
print("  Motor: MongoDB (documentos JSON)");
print("═══════════════════════════════════════════════\n");

print("📦 CATEGORÍAS (" + db.categorias.countDocuments() + "):");
printjson(leerCategorias());

print("\n🔧 PRODUCTOS (" + db.productos.countDocuments() + "):");
printjson(leerProductos());

print("\n👤 CLIENTES (" + db.clientes.countDocuments() + "):");
printjson(leerClientes());

print("\n🛒 PEDIDOS (" + db.pedidos.countDocuments() + "):");
printjson(leerPedidos());

print("\n🔐 USUARIOS (" + db.usuarios.countDocuments() + "):");
printjson(leerUsuarios());

print("\n✅ ¡Base de datos creada correctamente!");
print("   Prueba:  loginUsuario('admin@ferremateriales.com', 'admin123')");
print("   Prueba:  buscarProductosPorNombre('cemento')");
print("   Prueba:  productosConPocoStock(30)\n");

/*
══════════════════════════════════════════════
  EJEMPLOS DE USO — copia y pega en mongosh
══════════════════════════════════════════════

// Registrar un usuario nuevo
crearUsuario({
  _id: 3,
  nombre: "Juan Perez",
  correo: "juan@email.com",
  password: "juan123",
  rol: "cliente"
});

// Iniciar sesión
loginUsuario("laura@email.com", "laura123");

// Crear producto nuevo
crearProducto({
  _id: 8,
  nombre: "Llave expansiva 10 pulgadas",
  precio: 35000,
  stock: 15,
  categoriaId: 2,
  marca: "Stanley"
});

// Buscar productos baratos
db.productos.find({ precio: { $lt: 15000 } }).toArray();

// Actualizar stock de un producto
actualizarProducto(1, { stock: 75 });

// Ver pedidos pendientes
pedidosPorEstado("Pendiente");

// Crear pedido nuevo
crearPedido({
  _id: 3,
  clienteId: 2,
  fecha: new Date(),
  estado: "Pendiente",
  productos: [
    { productoId: 5, cantidad: 10, precioUnitario: 3200 }
  ],
  total: 32000
});
*/
