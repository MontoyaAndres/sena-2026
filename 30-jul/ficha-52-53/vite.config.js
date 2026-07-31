import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const desdeRaiz = (ruta) => fileURLToPath(new URL(ruta, import.meta.url));

// El código vive en src/ y el build sale a www/, que es el webDir que lee
// Capacitor (capacitor.config.json). Así `npx cap sync` copia siempre la
// versión compilada, no los fuentes.
export default defineConfig({
  root: "src",
  base: "./",
  build: {
    outDir: "../www",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // index.html es la app que se empaqueta en el APK.
        index: desdeRaiz("src/index.html"),
        // emulador.html solo se usa en el navegador durante el desarrollo.
        emulador: desdeRaiz("src/emulador.html"),
      },
    },
  },
  server: {
    // host: true expone el live server en la red local, para abrirlo
    // también desde un celular real conectado al mismo wifi.
    host: true,
    port: 5173,
  },
});
