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
  // **Se espera al marco, no al panel de recursos.** Ese panel se quitó de
  // `/reino` el 2026-09-22: los recursos viven arriba y el reparto en la
  // ficha de cada pieza del mapa.
  await page.waitForSelector('.marco__cifra', { timeout: 15_000 });

  console.log('\n--- escritorio 1280×900 ---');

  const arriba0 = await page.locator('.marco--arriba').innerText();
  comprobar('la pantalla del reino carga con datos reales', /\d/.test(arriba0),
    arriba0.replace(/\n/g, ' ').slice(0, 70));

  // --- El marco y la escena (docs/INTERFAZ.md §6.9 y §6.5) ---------------
  console.log('\n--- el marco y la escena ---');

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('button', { name: 'Reino' }).click();
  await page.waitForTimeout(500);

  const arriba = await page.locator('.marco--arriba').innerText();
  comprobar(
    'el marco enseña los cuatro recursos y los turnos',
    /geld/i.test(arriba) &&
      /man[áa]/i.test(arriba) &&
      /poblaci[óo]n/i.test(arriba) &&
      /net power/i.test(arriba) &&
      /turnos/i.test(arriba),
  );

  comprobar(
    'CRITERIO 15: la cadencia es la del servidor, no una constante',
    /\+1 cada 10 min/.test(arriba),
    'Terra va a 10 minutos; la referencia visual decía 15',
  );

  const barra = await page.locator('.marco--abajo').innerText();
  comprobar(
    'la barra lleva las seis sueltas y el «Más»',
    ['Reino', 'Ejército', 'Magia', 'Guerra', 'Crónica', 'Mensajes', 'Más'].every((n) =>
      barra.includes(n),
    ),
  );

  // CRITERIO 16: las dos barras ≤ 20% del alto a 360×640.
  await page.setViewportSize({ width: 360, height: 640 });
  await page.waitForTimeout(400);
  const alturas = await page.evaluate(() => {
    const a = document.querySelector('.marco--arriba');
    const b = document.querySelector('.marco--abajo');
    return {
      total: (a?.getBoundingClientRect().height ?? 0) + (b?.getBoundingClientRect().height ?? 0),
      alto: window.innerHeight,
    };
  });
  const porcentaje = (alturas.total / alturas.alto) * 100;
  comprobar(
    'CRITERIO 16: el marco no roba la pantalla',
    porcentaje <= 20,
    `${porcentaje.toFixed(1)}% del alto a 360×640, tope 20%`,
  );

  // **El mapa SÍ aparece en móvil desde el 2026-09-22**, al revés que antes.
  //
  // La decisión de esconderlo se tomó cuando `/reino` tenía además la tabla
  // de reparto; al quitarla, esconder el mapa dejaría el reparto sin ningún
  // sitio donde verse en un teléfono. Ahora se toca en vez de pasar el ratón.
  comprobar(
    'en móvil el mapa SIGUE ahí, porque el reparto vive en él',
    await page.locator('.mapa').isVisible(),
  );

  const fichaMovil = await page.evaluate(async () => {
    const b = document.querySelector('.mapa__pieza');
    b?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    return document.querySelector('.mapa__ficha')?.textContent ?? '';
  });
  comprobar(
    'y al TOCAR una pieza sale su ficha, que es lo que sustituye al hover',
    /Cantidad/.test(fichaMovil),
    fichaMovil.replace(/\s+/g, ' ').slice(0, 60),
  );

  // Y en escritorio sí, con sus piezas.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(400);
  const piezas = await page.locator('.mapa__pieza').count();
  comprobar(
    'CRITERIO 11: la escena pinta una pieza por tipo construido',
    piezas > 0 && piezas <= 8,
    `${piezas} piezas, y el reino de partida tiene 7 tipos con al menos uno`,
  );

  comprobar(
    'CRITERIO 5: los rótulos van en placas, no sueltos sobre la imagen',
    (await page.locator('.mapa__nombre').count()) === piezas,
  );

  // CRITERIO 14: son controles de verdad, no adorno.
  const toque = await page.evaluate(() => {
    const p = document.querySelector('.mapa__pieza');
    const r = p?.getBoundingClientRect();
    return { alto: r?.height ?? 0, foco: document.activeElement !== null };
  });
  comprobar('CRITERIO 14: las piezas son de dedo (≥44px)', toque.alto >= 44, `${toque.alto}px`);

  // **CRITERIO 13, reescrito el 2026-09-22.**
  //
  // Decía «ningún dato vive solo en la escena», y ya no es verdad: el reparto
  // de la tierra vive solo ahí desde que se quitó la tabla. Dejarlo como
  // estaba sería un criterio que el producto incumple a propósito.
  //
  // Lo que se comprueba ahora es lo que de verdad protege al jugador: **que
  // el dato se pueda alcanzar sin ratón**. Si sale al pulsar, sale en un
  // teléfono; y si no sale, el reparto no existe en la mitad del mundo.
  const alcanzable = await page.evaluate(async () => {
    const b = document.querySelector('.mapa__pieza');
    b?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    return document.querySelector('.mapa__ficha')?.textContent ?? '';
  });
  comprobar(
    'CRITERIO 13: el reparto se alcanza sin ratón, pulsando',
    /Cantidad/.test(alcanzable) && /% de tu tierra/.test(alcanzable),
    alcanzable.replace(/\s+/g, ' ').slice(0, 60),
  );

  await page.screenshot({ path: `${SALIDA}/marco-y-escena.png`, fullPage: true });

  comprobar('sin errores de consola', erroresConsola.length === 0, erroresConsola[0] ?? '');

  // Criterio 5: ningún texto tiene la ilustración como fondo directo.
  //
  // Se comprueba el **fondo calculado**, no el nombre de la clase. La primera
  // versión de este test exigía estar dentro de `.panel`, y eso es un
  // sustituto: los avisos tienen su propio fondo opaco y cumplían el criterio
  // aunque no fueran paneles. Un test que mide un proxy da falsos positivos y,
  // lo que es peor, falsos negativos.
  const textoSobreIlustracion = await page.evaluate(() => {
    const opaco = (color) => {
      if (!color || color === 'transparent') return false;
      const m = color.match(/rgba?\(([^)]+)\)/);
      if (!m) return false;
      const partes = m[1].split(',').map((n) => parseFloat(n));
      return partes.length < 4 || partes[3] >= 0.92;
    };
    const nodos = [...document.querySelectorAll('body *')].filter(
      (el) => el.children.length === 0 && el.textContent?.trim(),
    );
    for (const el of nodos) {
      let p = el;
      let cubierto = false;
      while (p && p !== document.documentElement) {
        const cs = getComputedStyle(p);
        // **Una imagen de fondo GANA al color, porque se pinta encima.**
        //
        // Este bucle solo miraba el backgroundColor, y daba por bueno
        // cualquier texto que tuviera un color opaco en algun ancestro —
        // aunque ESE MISMO ancestro pintara una ilustracion sobre el color.
        // Lo destapo la escena del reino el 2026-09-22: la nota iba escrita
        // sobre el paisaje y este criterio decia que todo bien.
        // Una textura ACOTADA no es una ilustracion: se le ha medido el
        // pixel mas claro y tiene techo (docs/INTERFAZ.md §6.5, regla 1).
        // Se declara en el marcado a proposito, para que pasar por aqui sea
        // una decision y no un descuido.
        if (cs.backgroundImage && cs.backgroundImage !== 'none') {
          if (p.dataset.textura === 'acotada') {
            cubierto = true;
          }
          break;
        }
        if (opaco(cs.backgroundColor)) {
          cubierto = true;
          break;
        }
        p = p.parentElement;
      }
      if (!cubierto) return `${el.className || el.tagName}: ${el.textContent.trim().slice(0, 40)}`;
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
    for (const el of document.querySelectorAll('.cifra, .marco__cifra, .mapa__datos dd')) {
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
    ['Magia', 'magia'],
    ['Crónica', 'cronica'],
  ]) {
    await page.getByRole('button', { name: nombre }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SALIDA}/${fichero}-escritorio.png`, fullPage: true });
    comprobar(`la pantalla ${nombre} se abre`, (await page.locator('.panel').count()) > 0);
  }

  // **El reparto no se ha perdido, se ha mudado.** Era una tabla y ahora es
  // la ficha de cada pieza. §3 lo sigue pidiendo «de un vistazo», así que si
  // esto falla es que el dato desapareció del juego.
  await page.getByRole('button', { name: 'Reino' }).click();
  await page.waitForTimeout(400);
  await page.locator('.mapa__pieza').first().hover();
  await page.waitForTimeout(400);
  const ficha = await page.locator('.mapa__ficha').first().innerText();
  comprobar(
    'el reparto de la tierra sigue estando, en la ficha del mapa',
    /Cantidad/.test(ficha) && /% de tu tierra/.test(ficha) && /\d/.test(ficha),
    ficha.replace(/\n+/g, ' | '),
  );

  // --- Una acción de verdad ---------------------------------------------
  console.log('\n--- una acción real ---');
  await page.getByRole('button', { name: 'Reino' }).click();
  await page.waitForTimeout(300);
  // La tierra se lee del marco, que es donde vive desde el 2026-09-22.
  const tierra = () =>
    page.locator('.marco__recurso', { hasText: 'Tierra' }).first().innerText();
  const tierraAntes = await tierra();
  await page.getByRole('button', { name: 'Explorar' }).click();
  await page.waitForTimeout(900);
  const tierraDespues = await tierra();
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
  await mp.waitForSelector('.marco__cifra', { timeout: 15_000 });

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
  await sp.waitForSelector('.marco__cifra', { timeout: 15_000 });

  const legibleSinImagenes = await sp.evaluate(() => {
    const body = getComputedStyle(document.body);
    const panel = document.querySelector('.panel');
    return {
      fondo: body.backgroundColor,
      hayPanel: !!panel,
      textoVisible: (document.querySelector('.marco__cifra')?.textContent ?? '').trim().length > 0,
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
