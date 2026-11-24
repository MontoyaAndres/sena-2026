// Header y footer comunes. Cada página tiene:
//   <header id="site-header"></header>  y  <footer id="site-footer"></footer>
// y al importar este archivo se llenan automáticamente.

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/admin.html', label: 'Administración' },
];

function isCurrent(href) {
  const path = location.pathname;
  if (href === '/') return path === '/' || path.endsWith('/index.html');
  return path.endsWith(href);
}

function renderHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  header.className = 'site-header';
  header.innerHTML = `
    <div class="container header-inner">
      <a class="brand" href="/"><span class="brand-icon" aria-hidden="true">📚</span> Biblioteca</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="Abrir menú">☰</button>
      <nav id="main-nav" class="main-nav" aria-label="Principal">
        ${NAV_LINKS.map(
          (link) => `<a href="${link.href}"${isCurrent(link.href) ? ' aria-current="page"' : ''}>${link.label}</a>`
        ).join('')}
      </nav>
    </div>`;

  // Menú móvil
  const toggle = header.querySelector('.nav-toggle');
  const nav = header.querySelector('.main-nav');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

function renderFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;

  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <h2>📚 Biblioteca</h2>
          <p>Un espacio para descubrir, leer y compartir historias. Explora nuestro catálogo y encuentra tu próximo libro favorito.</p>
        </div>
        <div>
          <h2>Navegación</h2>
          <ul>
            ${NAV_LINKS.map((link) => `<li><a href="${link.href}">${link.label}</a></li>`).join('')}
          </ul>
        </div>
        <div>
          <h2>Horario</h2>
          <ul>
            <li>Lunes a viernes: 8:00 – 18:00</li>
            <li>Sábados: 9:00 – 13:00</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">© ${new Date().getFullYear()} Biblioteca. Todos los derechos reservados.</div>
    </div>`;
}

renderHeader();
renderFooter();
