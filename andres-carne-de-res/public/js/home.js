// ---------- Hero / slider ----------
const hero = document.getElementById('hero');
const heroSlides = document.getElementById('hero-slides');
const heroPuntos = document.getElementById('hero-puntos');
const INTERVALO_MS = 5000;

// Textos del hero: información del negocio (se reparten sobre las fotos)
const INFO_NEGOCIO = [
  {
    etiqueta: 'Bienvenidos',
    titulo: 'Andrés Carne de Res',
    texto: 'Mucho más que un restaurante: comida, música, arte y rumba en un solo lugar.',
  },
  {
    etiqueta: 'Nuestra historia',
    titulo: 'Desde 1982 en Chía',
    texto: 'Empezamos como un pequeño asadero al borde de la carretera y hoy somos un ícono de Colombia.',
  },
  {
    etiqueta: 'La experiencia',
    titulo: 'Un lugar para celebrar',
    texto: 'Cumpleaños, reuniones o una noche cualquiera: aquí cada visita se convierte en fiesta.',
  },
];

let imagenes = [];
let slideActual = 0;
let temporizador = null;

async function cargarImagenes() {
  try {
    const res = await fetch('/api/imagenes');
    imagenes = await res.json();
  } catch {
    imagenes = [];
  }
}

function renderHero() {
  heroSlides.innerHTML = '';
  heroPuntos.innerHTML = '';

  // Un slide por foto; los textos del negocio se repiten si hay más fotos que textos
  const total = imagenes.length || INFO_NEGOCIO.length;

  for (let i = 0; i < total; i++) {
    const info = INFO_NEGOCIO[i % INFO_NEGOCIO.length];
    const imagen = imagenes.length ? imagenes[i] : null;

    const slide = document.createElement('div');
    slide.className = 'hero-slide';
    if (imagen) slide.style.backgroundImage = `url("${imagen}")`;

    const texto = document.createElement('div');
    texto.className = 'hero-texto';

    const etiqueta = document.createElement('span');
    etiqueta.className = 'hero-etiqueta';
    etiqueta.textContent = info.etiqueta;

    const titulo = document.createElement('h2');
    titulo.textContent = info.titulo;

    const desc = document.createElement('p');
    desc.textContent = info.texto;

    texto.append(etiqueta, titulo, desc);
    slide.appendChild(texto);
    heroSlides.appendChild(slide);

    const punto = document.createElement('button');
    punto.setAttribute('aria-label', `Ir al slide ${i + 1}`);
    punto.addEventListener('click', () => irASlide(i));
    heroPuntos.appendChild(punto);
  }

  const mostrarControles = total > 1;
  document.getElementById('hero-prev').hidden = !mostrarControles;
  document.getElementById('hero-next').hidden = !mostrarControles;
  heroPuntos.hidden = !mostrarControles;

  irASlide(0);
}

function irASlide(indice) {
  const slides = heroSlides.children;
  const puntos = heroPuntos.children;
  if (slides.length === 0) return;

  slideActual = (indice + slides.length) % slides.length;
  [...slides].forEach((s, i) => s.classList.toggle('activo', i === slideActual));
  [...puntos].forEach((p, i) => p.classList.toggle('activo', i === slideActual));
  reiniciarAutoplay();
}

function reiniciarAutoplay() {
  clearInterval(temporizador);
  if (heroSlides.children.length > 1) {
    temporizador = setInterval(() => irASlide(slideActual + 1), INTERVALO_MS);
  }
}

document.getElementById('hero-prev').addEventListener('click', () => irASlide(slideActual - 1));
document.getElementById('hero-next').addEventListener('click', () => irASlide(slideActual + 1));
hero.addEventListener('mouseenter', () => clearInterval(temporizador));
hero.addEventListener('mouseleave', reiniciarAutoplay);

// ---------- Menú de platos ----------
const menuGrid = document.getElementById('menu-grid');

async function cargarMenu() {
  let platos;
  try {
    platos = await obtenerPlatos();
  } catch {
    menuGrid.innerHTML = '<p class="menu-vacio">No se pudo cargar el menú. Intenta de nuevo más tarde.</p>';
    return;
  }

  menuGrid.innerHTML = '';
  if (platos.length === 0) {
    menuGrid.innerHTML = '<p class="menu-vacio">Pronto tendremos platos en el menú.</p>';
    return;
  }

  platos.forEach((plato) => menuGrid.appendChild(crearTarjetaPlato(plato)));
}

cargarImagenes().then(renderHero);
cargarMenu();
