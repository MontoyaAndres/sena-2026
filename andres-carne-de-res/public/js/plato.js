// Página de detalle: lee el id de la URL (plato.html?id=3) y muestra el plato completo

const estado = document.getElementById('detalle-estado');
const detalle = document.getElementById('detalle');

function mostrarError(texto) {
  estado.textContent = texto;
  estado.hidden = false;
  detalle.hidden = true;
}

async function cargarDetalle() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) return mostrarError('No se indicó ningún plato.');

  let plato;
  try {
    const res = await fetch(`${API_URL}/${encodeURIComponent(id)}`);
    if (res.status === 404) return mostrarError('Este plato no existe o ya no está en el menú.');
    if (!res.ok) throw new Error();
    plato = await res.json();
  } catch {
    return mostrarError('No se pudo cargar el plato. Intenta de nuevo más tarde.');
  }

  document.title = `${plato.nombre} - Andrés Carne de Res`;

  const foto = document.getElementById('detalle-foto');
  foto.src = plato.imagen || FOTO_POR_DEFECTO;
  foto.alt = plato.nombre;

  document.getElementById('detalle-nombre').textContent = plato.nombre;
  document.getElementById('detalle-precio').textContent = formatoPrecio.format(plato.precio);
  document.getElementById('detalle-descripcion').textContent = plato.descripcion;

  // Ingredientes: se guardan como texto separado por comas
  const ingredientes = (plato.ingredientes || '')
    .split(',')
    .map((i) => i.trim())
    .filter(Boolean);

  const lista = document.getElementById('detalle-ingredientes');
  lista.innerHTML = '';
  ingredientes.forEach((ingrediente) => {
    const li = document.createElement('li');
    li.textContent = ingrediente;
    lista.appendChild(li);
  });
  document.getElementById('detalle-ingredientes-seccion').hidden = ingredientes.length === 0;

  estado.hidden = true;
  detalle.hidden = false;

  cargarOtros(plato.id);
}

// "También te puede gustar": hasta 3 platos distintos al actual
async function cargarOtros(idActual) {
  try {
    const otros = (await obtenerPlatos()).filter((p) => p.id !== idActual).slice(0, 3);
    if (otros.length === 0) return;

    const grid = document.getElementById('otros-grid');
    otros.forEach((plato) => grid.appendChild(crearTarjetaPlato(plato)));
    document.getElementById('otros').hidden = false;
  } catch {
    // Si falla, simplemente no se muestra la sección
  }
}

cargarDetalle();
