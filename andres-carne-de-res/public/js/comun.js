// Utilidades compartidas entre el home y el panel de administración

const API_URL = '/api/platos';

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const FOTO_POR_DEFECTO = '/images/Restaurante-Andres-carne-de-res-en-Bogota-Colombia.jpg';

async function obtenerPlatos() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('No se pudieron cargar los platos');
  return res.json();
}

// Tarjeta de plato del menú: enlace a su página de detalle
function crearTarjetaPlato(plato) {
  const tarjeta = document.createElement('a');
  tarjeta.className = 'menu-item';
  tarjeta.href = `plato.html?id=${plato.id}`;

  const img = document.createElement('img');
  img.src = plato.imagen || FOTO_POR_DEFECTO;
  img.alt = plato.nombre;
  img.loading = 'lazy';

  const cuerpo = document.createElement('div');
  cuerpo.className = 'menu-item-cuerpo';

  const titulo = document.createElement('h3');
  titulo.textContent = plato.nombre;

  const desc = document.createElement('p');
  desc.textContent = plato.descripcion;

  const precio = document.createElement('span');
  precio.className = 'precio';
  precio.textContent = formatoPrecio.format(plato.precio);

  const verMas = document.createElement('span');
  verMas.className = 'ver-mas';
  verMas.textContent = 'Ver detalle →';

  const pie = document.createElement('div');
  pie.className = 'menu-item-pie';
  pie.append(precio, verMas);

  cuerpo.append(titulo, desc, pie);
  tarjeta.append(img, cuerpo);
  return tarjeta;
}
