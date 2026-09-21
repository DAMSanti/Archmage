/**
 * La pasada de navegador de la fase 1.
 *
 * Comprueba los criterios 4 a 10 de docs/INTERFAZ.md §6.7, que son los que
 * **no se pueden calcular sobre los tokens**. Es una sola pasada para las
 * tareas 19, 20 y 21 juntas: lo caro es arrancar la sesión, no lo que
 * comprueba (docs/ARQUITECTURA.md §6).
 *
 * Se ejecuta a mano con `node apps/web/tests/navegador.mjs`, con el servidor
 * y el cliente levantados. No está en la suite de Vitest a propósito: pide
 * turno exclusivo (docs/AGENTES.md §2).
 */

import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const URL = process.env.WEB_URL ?? 'http://127.0.0.1:5173';
const EXE =
  process.env.CHROME_PATH ??
  `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe`;
const SALIDA = 'apps/web/tests/capturas';

const resultados = [];
const comprobar = (nombre, ok, detalle = '') => {
  resultados.push({ nombre, ok, detalle });
  console.log(`  ${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
};

mkdirSync(SALIDA, { recursive: true });

const browser = await chromium.launch({ executablePath: EXE });

try {
  // --- Escritorio --------------------------------------------------------
  const escritorio = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await escritorio.newPage();
  const erroresConsola = [];
  page.on('console', (m) => m.type() === 'error' && erroresConsola.push(m.text()));
  page.on('pageerror', (e) => erroresConsola.push(String(e)));

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('.recurso__valor', { timeout: 15_000 });

  console.log('\n--- escritorio 1280×900 ---');

  const turnos = await page.locator('.recurso').first().innerText();
  comprobar('la pantalla del reino carga con datos reales', /\d/.test(turnos), turnos.replace(/\n/g, ' '));

  comprobar('sin errores de consola', erroresConsola.length === 0, erroresConsola[0] ?? '');

  // Criterio 5: ningún texto tiene la ilustración como fondo directo.
  const textoSobreIlustracion = await page.evaluate(() => {
    const escena = document.querySelector('.escena');
    if (!escena) return 'no hay .escena';
    const nodos = [...document.querySelectorAll('body *')].filter(
      (el) => el.children.length === 0 && el.textContent?.trim(),
    );
    for (const el of nodos) {
      let p = el;
      let dentroDePanel = false;
      while (p && p !== document.body) {
        if (p.classList.contains('panel') || p.classList.contains('cabecera') || p.classList.contains('nav')) {
          dentroDePanel = true;
          break;
        }
        p = p.parentElement;
      }
      if (!dentroDePanel) return el.textContent.trim().slice(0, 40);
    }
    return null;
  });
  comprobar(
    'criterio 5 — ningún texto se dibuja sobre la ilustración',
    textoSobreIlustracion === null,
    textoSobreIlustracion ?? '',
  );

  // Criterio 8: los tokens de escuela no se usan fuera de contextos de escuela.
  const coloresDeEscuela = await page.evaluate(() => {
    const escuela = ['#f2ead8', '#4e9e4a', '#d1442c', '#3f7fc4', '#8574a0'];
    const aRgb = (h) =>
      `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;
    const buscados = new Set(escuela.map(aRgb));
    const encontrados = [];
    for (const el of document.querySelectorAll('body *')) {
      const s = getComputedStyle(el);
      for (const prop of ['color', 'backgroundColor', 'borderTopColor']) {
        if (buscados.has(s[prop])) encontrados.push(`${el.className || el.tagName}:${prop}`);
      }
    }
    return encontrados;
  });
  comprobar(
    'criterio 9 — los colores de escuela no pintan la interfaz',
    coloresDeEscuela.length === 0,
    coloresDeEscuela.slice(0, 3).join(', '),
  );

  // Criterio 7: cifras tabulares en las columnas de números.
  const sinTabulares = await page.evaluate(() => {
    const malos = [];
    for (const el of document.querySelectorAll('.cifra, .recurso__valor, .reparto td')) {
      const v = getComputedStyle(el).fontVariantNumeric;
      if (!v.includes('tabular-nums')) malos.push(el.className || el.tagName);
    }
    return malos;
  });
  comprobar('criterio 7 — cifras tabulares en toda columna de números', sinTabulares.length === 0, sinTabulares.slice(0, 3).join(', '));

  await page.screenshot({ path: `${SALIDA}/reino-escritorio.png`, fullPage: true });

  // Recorrer las otras dos pantallas.
  for (const [nombre, fichero] of [
    ['Ejército', 'ejercito'],
    ['Crónica', 'cronica'],
  ]) {
    await page.getByRole('button', { name: nombre }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SALIDA}/${fichero}-escritorio.png`, fullPage: true });
    comprobar(`la pantalla ${nombre} se abre`, (await page.locator('.panel').count()) > 0);
  }

  // --- Una acción de verdad ---------------------------------------------
  console.log('\n--- una acción real ---');
  await page.getByRole('button', { name: 'Reino' }).click();
  await page.waitForTimeout(300);
  const tierraAntes = await page.locator('.recurso').nth(4).innerText();
  await page.getByRole('button', { name: 'Explorar' }).click();
  await page.waitForTimeout(900);
  const tierraDespues = await page.locator('.recurso').nth(4).innerText();
  comprobar(
    'explorar cambia la tierra en pantalla',
    tierraAntes !== tierraDespues,
    `${tierraAntes.replace(/\n/g, ' ')} -> ${tierraDespues.replace(/\n/g, ' ')}`,
  );

  // --- Móvil 360px -------------------------------------------------------
  console.log('\n--- móvil 360×740 ---');
  const movil = await browser.newContext({
    viewport: { width: 360, height: 740 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mp = await movil.newPage();
  await mp.goto(URL, { waitUntil: 'networkidle' });
  await mp.waitForSelector('.recurso__valor', { timeout: 15_000 });

  const scrollH = await mp.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    cliente: document.documentElement.clientWidth,
  }));
  comprobar(
    'criterio 8 — sin desplazamiento horizontal a 360px',
    scrollH.scroll <= scrollH.cliente,
    `scrollWidth ${scrollH.scroll} vs ${scrollH.cliente}`,
  );

  const anchoDatos = await mp.evaluate(() => {
    const panel = document.querySelector('.panel');
    if (!panel) return 0;
    return panel.getBoundingClientRect().width / document.documentElement.clientWidth;
  });
  comprobar(
    'criterio 8 — el área de datos ocupa ≥85% del ancho',
    anchoDatos >= 0.85,
    `${(anchoDatos * 100).toFixed(1)}%`,
  );

  const toquesPequenos = await mp.evaluate(() => {
    const malos = [];
    for (const el of document.querySelectorAll('button, select, input')) {
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.height < 40) malos.push(`${el.tagName} ${r.height.toFixed(0)}px`);
    }
    return malos;
  });
  comprobar('zonas de toque de dedo (≥40px)', toquesPequenos.length === 0, toquesPequenos.slice(0, 3).join(', '));

  await mp.screenshot({ path: `${SALIDA}/reino-movil.png`, fullPage: true });

  // --- Sin imágenes ------------------------------------------------------
  console.log('\n--- con las imágenes bloqueadas ---');
  const sinImg = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await sinImg.route('**/*.{png,jpg,jpeg,webp,avif,svg}', (r) => r.abort());
  const sp = await sinImg.newPage();
  await sp.goto(URL, { waitUntil: 'networkidle' });
  await sp.waitForSelector('.recurso__valor', { timeout: 15_000 });

  const legibleSinImagenes = await sp.evaluate(() => {
    const body = getComputedStyle(document.body);
    const panel = document.querySelector('.panel');
    return {
      fondo: body.backgroundColor,
      hayPanel: !!panel,
      textoVisible: (document.querySelector('.recurso__valor')?.textContent ?? '').trim().length > 0,
    };
  });
  comprobar(
    'criterio 4 — sin imágenes la pantalla se lee completa',
    legibleSinImagenes.hayPanel && legibleSinImagenes.textoVisible,
    `fondo ${legibleSinImagenes.fondo}`,
  );
  await sp.screenshot({ path: `${SALIDA}/reino-sin-imagenes.png`, fullPage: true });

  console.log('\n=== resumen ===');
  const fallos = resultados.filter((r) => !r.ok);
  console.log(`${resultados.length - fallos.length}/${resultados.length} comprobaciones OK`);
  if (fallos.length) {
    for (const f of fallos) console.log(`  FALLA: ${f.nombre} — ${f.detalle}`);
    process.exitCode = 1;
  }
  console.log(`capturas en ${SALIDA}/`);
} finally {
  await browser.close();
}
