/**
 * Punto de entrada de la aplicación.
 *
 * Aquí se juntan tres cosas:
 *   1. Reveal.js, que dibuja la presentación (ahora empaquetado, no por CDN,
 *      para que la app funcione sin internet dentro del APK).
 *   2. Los plugins de Capacitor, que en el navegador usan su implementación
 *      web y en el celular la nativa. El mismo código sirve para los dos.
 *   3. El ajuste de formato: escritorio 1280x720, celular vertical 400x780.
 */
import Reveal from "reveal.js"; // sus estilos los carga css/estilos.css

import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Device } from "@capacitor/device";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Share } from "@capacitor/share";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

const raiz = document.documentElement;
const parametros = new URLSearchParams(location.search);

/* ------------------------------------------------------------------ */
/* 1. Áreas seguras (notch, isla dinámica, barra de gestos)            */
/* ------------------------------------------------------------------ */
/* En un celular real las da el sistema con env(safe-area-inset-*).     */
/* Dentro del emulador no existen, así que el marco las envía por la    */
/* URL (?sat=59&sab=34...) y aquí se traducen a variables CSS.          */
const insets = { sat: "top", sab: "bottom", sal: "left", sar: "right" };

function aplicarAreasSeguras() {
  Object.keys(insets).forEach((clave) => {
    const valor = parametros.get(clave);
    if (valor !== null) raiz.style.setProperty(`--${clave}`, `${valor}px`);
  });
  raiz.classList.toggle("con-marco", parametros.has("sat"));
}

/* ------------------------------------------------------------------ */
/* 2. Reveal.js con dos formatos                                        */
/* ------------------------------------------------------------------ */
const FORMATO_ESCRITORIO = {
  width: 1280,
  height: 720,
  margin: 0.045,
  controls: true,
};
// En celular se navega deslizando, así que las flechas de reveal sobran:
// solo tapan el riel de evidencias.
const FORMATO_MOVIL = {
  width: 400,
  height: 780,
  margin: 0.02,
  controls: false,
};

const esCompacto = () => window.innerWidth < 760;

function formatoActual() {
  return esCompacto() ? FORMATO_MOVIL : FORMATO_ESCRITORIO;
}

const deck = new Reveal({
  ...formatoActual(),
  minScale: 0.2,
  maxScale: 1.6,
  center: false,
  hash: true,
  slideNumber: "c/t",
  transition: "slide",
  transitionSpeed: "fast",
  backgroundTransition: "none",
  // Navegación por deslizamiento: es la forma natural de pasar diapositivas
  // en un celular, y también funciona con el mouse dentro del emulador.
  touch: true,
});

let compactoPrevio = esCompacto();

function aplicarFormato() {
  const compacto = esCompacto();
  raiz.classList.toggle("compacto", compacto);
  if (compacto !== compactoPrevio || !deck.isReady()) {
    compactoPrevio = compacto;
    deck.configure(formatoActual());
  }
  deck.layout();
}

/* ------------------------------------------------------------------ */
/* 3. Riel de evidencias                                                */
/* ------------------------------------------------------------------ */
const pasos = document.querySelectorAll("#riel .paso");

function actualizarRiel() {
  const actual = deck.getCurrentSlide();
  if (!actual) return;
  const contenedor = actual.closest("section[data-ev]");
  const ev = contenedor ? parseInt(contenedor.getAttribute("data-ev"), 10) : 0;

  pasos.forEach((paso) => {
    const n = parseInt(paso.getAttribute("data-paso"), 10);
    paso.classList.toggle("activo", n === ev);
    paso.classList.toggle("hecho", ev > 4 || n < ev);
  });
}

/* ------------------------------------------------------------------ */
/* 4. Capacitor                                                         */
/* ------------------------------------------------------------------ */
const nativo = Capacitor.isNativePlatform();
const plataforma = Capacitor.getPlatform(); // "web" | "android" | "ios"

const chipEstado = document.getElementById("estado");
const botonCompartir = document.getElementById("compartir");

async function iniciarCapacitor() {
  // Device sí tiene implementación web: funciona igual en el navegador.
  let etiqueta = plataforma;
  try {
    const info = await Device.getInfo();
    etiqueta = `${info.platform} · ${info.model} · ${info.operatingSystem} ${info.osVersion}`;
  } catch (error) {
    console.warn("[capacitor] Device.getInfo no disponible", error);
  }
  if (chipEstado) {
    chipEstado.textContent = etiqueta;
    chipEstado.dataset.plataforma = plataforma;
    chipEstado.title = nativo
      ? "Corriendo dentro del contenedor nativo"
      : "Corriendo en el navegador (implementación web de Capacitor)";
  }

  // StatusBar y SplashScreen solo existen en el contenedor nativo.
  // En web lanzan "not implemented", por eso el try/catch.
  if (nativo) {
    try {
      await StatusBar.setStyle({ style: Style.Light });
      if (plataforma === "android") {
        await StatusBar.setBackgroundColor({ color: "#edefe8" });
      }
    } catch (error) {
      console.warn("[capacitor] StatusBar no disponible", error);
    }
    try {
      await SplashScreen.hide();
    } catch (error) {
      console.warn("[capacitor] SplashScreen no disponible", error);
    }
  }

  // Botón físico "atrás" de Android: retrocede una diapositiva y solo
  // cierra la app cuando ya está en la primera.
  App.addListener("backButton", ({ canGoBack }) => {
    const indices = deck.getIndices();
    if (indices.h === 0 && (indices.v || 0) === 0 && !canGoBack) {
      App.exitApp();
    } else {
      deck.prev();
    }
  }).catch(() => {});

  App.addListener("appStateChange", ({ isActive }) => {
    document.body.classList.toggle("en-pausa", !isActive);
  }).catch(() => {});
}

function vibrar() {
  // En web usa navigator.vibrate (Android/Chrome); si no existe, se ignora.
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

async function compartir() {
  const carga = {
    title: document.title,
    text: "Actividad GA8-220501096-AA2 · Fichas 3186652 y 3186653",
    url: location.href,
    dialogTitle: "Compartir la actividad",
  };
  try {
    await Share.share(carga);
  } catch (error) {
    // El navegador de escritorio no siempre expone la Web Share API.
    if (error?.message?.includes("canceled")) return;
    try {
      await navigator.clipboard.writeText(carga.url);
      botonCompartir?.classList.add("copiado");
      setTimeout(() => botonCompartir?.classList.remove("copiado"), 1600);
    } catch {
      console.warn("[capacitor] Share no disponible", error);
    }
  }
}

/* ------------------------------------------------------------------ */
/* 5. Arranque                                                          */
/* ------------------------------------------------------------------ */
aplicarAreasSeguras();
raiz.classList.toggle("compacto", esCompacto());

deck.initialize().then(() => {
  aplicarFormato();
  actualizarRiel();
  iniciarCapacitor();
});

deck.on("slidechanged", () => {
  actualizarRiel();
  vibrar();
});

window.addEventListener("resize", aplicarFormato);
window.addEventListener("orientationchange", aplicarFormato);
botonCompartir?.addEventListener("click", compartir);

// El emulador (emulador.html) usa estas referencias para los botones de
// navegación de su barra de herramientas.
window.__deck = deck;
window.__capacitor = { nativo, plataforma };
