// ---------- Sesión ----------
const CLAVE_TOKEN = 'token';

function obtenerToken() {
  try {
    return localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

function guardarToken(token) {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    // Si el navegador bloquea localStorage, la sesión dura solo mientras la página esté abierta
  }
}

let token = obtenerToken();

// fetch con el token de sesión; si el servidor responde 401, vuelve al login
async function fetchAuth(url, opciones = {}) {
  const res = await fetch(url, {
    ...opciones,
    headers: { ...opciones.headers, Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    cerrarSesionLocal();
    throw new Error('Tu sesión expiró, vuelve a iniciar sesión');
  }
  return res;
}

// ---------- Vistas ----------
const vistaLogin = document.getElementById('vista-login');
const vistaAdmin = document.getElementById('vista-admin');
const usuarioActual = document.getElementById('usuario-actual');
const btnSalir = document.getElementById('btn-salir');

function mostrarLogin() {
  vistaLogin.hidden = false;
  vistaAdmin.hidden = true;
  usuarioActual.hidden = true;
  btnSalir.hidden = true;
  document.getElementById('login-usuario').focus();
}

function mostrarAdmin(usuario) {
  vistaLogin.hidden = true;
  vistaAdmin.hidden = false;
  usuarioActual.textContent = `Hola, ${usuario}`;
  usuarioActual.hidden = false;
  btnSalir.hidden = false;
  cargarPlatos();
}

function cerrarSesionLocal() {
  token = null;
  guardarToken(null);
  mostrarLogin();
}

async function iniciar() {
  if (!token) return mostrarLogin();
  try {
    const res = await fetchAuth('/api/auth/me');
    const { usuario } = await res.json();
    mostrarAdmin(usuario);
  } catch {
    // fetchAuth ya mostró el login
  }
}

// ---------- Login / logout ----------
const formLogin = document.getElementById('form-login');
const loginError = document.getElementById('login-error');

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario: document.getElementById('login-usuario').value.trim(),
      password: document.getElementById('login-password').value,
    }),
  });
  const datos = await res.json();

  if (!res.ok) {
    loginError.textContent = datos.error;
    return;
  }

  token = datos.token;
  guardarToken(token);
  formLogin.reset();
  mostrarAdmin(datos.usuario);
});

btnSalir.addEventListener('click', async () => {
  try {
    await fetchAuth('/api/auth/logout', { method: 'POST' });
  } catch {
    // aunque falle, cerramos la sesión en este navegador
  }
  cerrarSesionLocal();
});

// ---------- CRUD de platos ----------
const form = document.getElementById('form-plato');
const inputId = document.getElementById('plato-id');
const inputNombre = document.getElementById('nombre');
const inputDescripcion = document.getElementById('descripcion');
const inputIngredientes = document.getElementById('ingredientes');
const inputPrecio = document.getElementById('precio');
const inputImagen = document.getElementById('imagen');
const preview = document.getElementById('preview');
const btnCancelar = document.getElementById('btn-cancelar');
const formTitulo = document.getElementById('form-titulo');
const lista = document.getElementById('lista-platos');
const mensaje = document.getElementById('mensaje');

function mostrarMensaje(texto, esError = false) {
  mensaje.textContent = texto;
  mensaje.classList.toggle('error', esError);
  setTimeout(() => (mensaje.textContent = ''), 3000);
}

function mostrarPreview(src) {
  preview.src = src || '';
  preview.hidden = !src;
}

inputImagen.addEventListener('change', () => {
  const archivo = inputImagen.files[0];
  mostrarPreview(archivo ? URL.createObjectURL(archivo) : null);
});

async function cargarPlatos() {
  const platos = await obtenerPlatos();

  lista.innerHTML = '';
  if (platos.length === 0) {
    lista.innerHTML = '<li>No hay platos todavía.</li>';
    return;
  }

  platos.forEach((plato) => {
    const li = document.createElement('li');
    li.className = 'plato';

    const img = document.createElement('img');
    img.className = 'plato-foto';
    img.src = plato.imagen || FOTO_POR_DEFECTO;
    img.alt = '';

    const info = document.createElement('div');
    info.className = 'plato-info';
    const titulo = document.createElement('h3');
    titulo.textContent = plato.nombre;
    const desc = document.createElement('p');
    desc.textContent = plato.descripcion;
    const precio = document.createElement('span');
    precio.className = 'precio';
    precio.textContent = formatoPrecio.format(plato.precio);
    info.append(titulo, desc, precio);

    const botones = document.createElement('div');
    botones.className = 'botones';

    const btnEditar = document.createElement('button');
    btnEditar.className = 'secundario';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', () => editarPlato(plato));

    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.addEventListener('click', () => eliminarPlato(plato.id));

    botones.append(btnEditar, btnEliminar);
    li.append(img, info, botones);
    lista.appendChild(li);
  });
}

function editarPlato(plato) {
  inputId.value = plato.id;
  inputNombre.value = plato.nombre;
  inputDescripcion.value = plato.descripcion;
  inputIngredientes.value = plato.ingredientes || '';
  inputPrecio.value = plato.precio;
  inputImagen.value = '';
  mostrarPreview(plato.imagen);
  formTitulo.textContent = 'Editar plato';
  btnCancelar.hidden = false;
  form.scrollIntoView({ behavior: 'smooth' });
  inputNombre.focus();
}

function limpiarFormulario() {
  form.reset();
  inputId.value = '';
  mostrarPreview(null);
  formTitulo.textContent = 'Nuevo plato';
  btnCancelar.hidden = true;
}

async function eliminarPlato(id) {
  try {
    const res = await fetchAuth(`${API_URL}/${id}`, { method: 'DELETE' });
    if (res.ok) {
      mostrarMensaje('Plato eliminado');
      cargarPlatos();
    }
  } catch (err) {
    mostrarMensaje(err.message, true);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // FormData permite enviar los campos de texto junto con el archivo de la foto
  const datos = new FormData();
  datos.append('nombre', inputNombre.value.trim());
  datos.append('descripcion', inputDescripcion.value.trim());
  datos.append('ingredientes', inputIngredientes.value.trim());
  datos.append('precio', inputPrecio.value);
  if (inputImagen.files[0]) datos.append('imagen', inputImagen.files[0]);

  const id = inputId.value;
  try {
    const res = await fetchAuth(id ? `${API_URL}/${id}` : API_URL, {
      method: id ? 'PUT' : 'POST',
      body: datos,
    });

    if (!res.ok) {
      const { error } = await res.json();
      mostrarMensaje(`Error: ${error}`, true);
      return;
    }

    mostrarMensaje(id ? 'Plato actualizado' : 'Plato creado');
    limpiarFormulario();
    cargarPlatos();
  } catch (err) {
    mostrarMensaje(err.message, true);
  }
});

btnCancelar.addEventListener('click', limpiarFormulario);

iniciar();
