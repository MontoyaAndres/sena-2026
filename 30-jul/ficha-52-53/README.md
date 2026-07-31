# GA8-220501096-AA2 · app móvil con Capacitor

La presentación de la actividad convertida en una aplicación Capacitor, con un
**emulador de dispositivo dentro del navegador**: no hace falta Xcode ni Android
Studio para ver cómo se comporta en un celular.

## Arrancar

```bash
npm install      # solo la primera vez
npm run dev      # abre el emulador en http://localhost:5173/emulador.html
```

| Comando         | Qué hace                                                       |
| --------------- | -------------------------------------------------------------- |
| `npm run dev`   | Live server (Vite) + emulador de dispositivo, con recarga en caliente |
| `npm run app`   | La app sola, sin el marco del emulador                          |
| `npm run build` | Compila a `www/`, que es el `webDir` que lee Capacitor          |
| `npm run sync`  | Compila y copia el resultado a las plataformas nativas          |

## Qué hace el emulador

`src/emulador.html` es una página que carga la app en un iframe del tamaño exacto
de un dispositivo y le simula lo que un navegador de escritorio no tiene:

- **Tamaño y densidad reales**: iPhone 15 Pro / Pro Max, iPhone SE, Pixel 8,
  Galaxy S23, Moto G e iPad mini.
- **Áreas seguras** (`safe-area-insets`): el notch, la isla dinámica y la barra
  de gestos. Como `env(safe-area-inset-*)` no existe en un iframe de escritorio,
  el emulador se las pasa a la app por la URL (`?sat=59&sab=34…`) y `js/app.js`
  las convierte en las variables CSS `--sat`, `--sab`, `--sal`, `--sar`.
- **Táctil**: arrastrar sobre la pantalla desliza entre diapositivas; si la
  lámina es larga, el arrastre vertical la desplaza. Un clic corto se reenvía
  como toque real al elemento que está debajo.
- **Rotación**, zoom y barra de estado simulada.

Para probar en un celular de verdad, `npm run dev` también publica la app en la
red local (`http://<tu-ip>:5173/index.html`): basta con abrir esa dirección desde
el navegador del teléfono estando en el mismo wifi.

## Qué hace Capacitor aquí

El mismo código corre en el navegador y dentro del contenedor nativo; cada plugin
usa su implementación web cuando no hay celular. El chip de la esquina superior
derecha muestra la plataforma detectada (`web`, `android` o `ios`).

| Plugin           | En el navegador                        | En el celular                          |
| ---------------- | -------------------------------------- | -------------------------------------- |
| `@capacitor/device` | Datos del navegador                 | Marca, modelo y versión del sistema     |
| `@capacitor/haptics` | `navigator.vibrate`                | Vibración del dispositivo               |
| `@capacitor/share`  | Web Share API o copiar al portapapeles | Menú de compartir del sistema        |
| `@capacitor/app`    | —                                   | Botón físico "atrás" y ciclo de vida    |
| `@capacitor/status-bar` | —                               | Color y estilo de la barra de estado    |
| `@capacitor/splash-screen` | —                            | Pantalla de arranque                    |

## Cuando haya Android Studio o Xcode

El proyecto ya está listo; solo falta agregar la plataforma:

```bash
npm run add:android   # o npm run add:ios
npx cap open android  # abre el proyecto nativo para generar el APK
```

Para depurar con recarga en caliente sobre un dispositivo real, agregar a
`capacitor.config.json`:

```json
"server": { "url": "http://TU_IP_LOCAL:5173", "cleartext": true }
```

## Estructura

```
src/index.html        la app (es el index.html que se empaqueta en el APK)
src/emulador.html     el marco de dispositivo, solo para desarrollo
src/css/estilos.css   estilos propios + @import de reveal.js
src/js/app.js         reveal.js, plugins de Capacitor y formato responsive
capacitor.config.json appId, appName y webDir
www/                  resultado de `npm run build` (no se versiona)
```
