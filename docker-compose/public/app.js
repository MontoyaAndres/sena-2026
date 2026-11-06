const API = "/api/productos";

const form = document.getElementById("form-producto");
const formTitulo = document.getElementById("form-titulo");
const btnCancelar = document.getElementById("btn-cancelar");
const tabla = document.getElementById("tabla-productos");
const vacio = document.getElementById("vacio");
const mensaje = document.getElementById("mensaje");
const buscar = document.getElementById("buscar");

const campos = ["nombre", "talla", "color", "tipo", "marca", "precio"];

const formatoPrecio = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function mostrarMensaje(texto, esError = false) {
  mensaje.textContent = texto;
  mensaje.className = esError ? "mensaje error" : "mensaje";
  mensaje.hidden = false;
  setTimeout(() => (mensaje.hidden = true), 3000);
}

// Crea una celda de tabla con texto (textContent evita inyeccion de HTML)
function celda(texto) {
  const td = document.createElement("td");
  td.textContent = texto;
  return td;
}

// READ: trae los productos del servidor y los pinta en la tabla
async function cargarProductos() {
  const q = buscar.value.trim();
  const url = q ? `${API}?q=${encodeURIComponent(q)}` : API;
  try {
    const res = await fetch(url);
    const productos = await res.json();
    if (!res.ok) throw new Error(productos.error);

    tabla.innerHTML = "";
    vacio.hidden = productos.length > 0;
    document.getElementById("tabla-totales").hidden = productos.length === 0;

    // Suma subtotal, IVA y total de todos los productos de la tabla
    let sumaSubtotal = 0;
    let sumaIva = 0;
    let sumaTotal = 0;
    for (const p of productos) {
      sumaSubtotal += p.subtotal;
      sumaIva += p.iva;
      sumaTotal += p.total;
    }
    document.getElementById("suma-subtotal").textContent = formatoPrecio.format(sumaSubtotal);
    document.getElementById("suma-iva").textContent = formatoPrecio.format(sumaIva);
    document.getElementById("suma-total").textContent = formatoPrecio.format(sumaTotal);

    for (const p of productos) {
      const tr = document.createElement("tr");
      tr.append(
        celda(p.id),
        celda(p.nombre),
        celda(p.talla),
        celda(p.color),
        celda(p.tipo),
        celda(p.marca),
        celda(formatoPrecio.format(p.subtotal)),
        celda(formatoPrecio.format(p.iva)),
        celda(formatoPrecio.format(p.total))
      );

      const tdBotones = document.createElement("td");
      tdBotones.className = "botones";

      const btnEditar = document.createElement("button");
      btnEditar.textContent = "Editar";
      btnEditar.className = "editar";
      btnEditar.onclick = () => editarProducto(p);

      const btnEliminar = document.createElement("button");
      btnEliminar.textContent = "Eliminar";
      btnEliminar.className = "eliminar";
      btnEliminar.onclick = () => eliminarProducto(p);

      tdBotones.append(btnEditar, btnEliminar);
      tr.append(tdBotones);
      tabla.append(tr);
    }
  } catch (err) {
    mostrarMensaje(err.message || "No se pudieron cargar los productos", true);
  }
}

// Pone los datos del producto en el formulario para editarlo
function editarProducto(p) {
  document.getElementById("id").value = p.id;
  for (const campo of campos) {
    document.getElementById(campo).value = p[campo];
  }
  formTitulo.textContent = `Editar producto #${p.id}`;
  btnCancelar.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function limpiarFormulario() {
  form.reset();
  document.getElementById("id").value = "";
  formTitulo.textContent = "Nuevo producto";
  btnCancelar.hidden = true;
}

// DELETE
async function eliminarProducto(p) {
  if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
  try {
    const res = await fetch(`${API}/${p.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    mostrarMensaje("Producto eliminado");
    cargarProductos();
  } catch (err) {
    mostrarMensaje(err.message, true);
  }
}

// CREATE o UPDATE segun si hay un id en el formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("id").value;
  const producto = {};
  for (const campo of campos) {
    producto[campo] = document.getElementById(campo).value.trim();
  }
  producto.precio = Number(producto.precio);

  try {
    const res = await fetch(id ? `${API}/${id}` : API, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(producto),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    mostrarMensaje(id ? "Producto actualizado" : "Producto creado");
    limpiarFormulario();
    cargarProductos();
  } catch (err) {
    mostrarMensaje(err.message, true);
  }
});

btnCancelar.addEventListener("click", limpiarFormulario);

// Busca mientras se escribe (espera 300ms para no llamar al servidor en cada tecla)
let timer;
buscar.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(cargarProductos, 300);
});

cargarProductos();
