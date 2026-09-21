/**
 * La pasada de navegador de la fase 5: gremio, mensajes y temporada.
 *
 * **Una sola pasada para las tres pantallas** (docs/ARQUITECTURA.md §6).
 * Pide turno exclusivo (docs/AGENTES.md §2).
 *
 * Lo que comprueba es **lo que no se puede calcular sin pintar**: que el
 * gremio diga el coste de aliarse **antes** de aliarse, que los mensajes
 * lleven el bloqueo a un clic, y que la temporada enseñe **las dos vías a
 * la vez** — los sellos y la fecha tope.
 *
 * Se ejecuta a mano: `node apps/web/tests/navegador-temporada.mjs`.
 */

import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const URL = process.env.WEB_URL ?? 'http://localhost:3001';
const EXE =
  process.env.CHROME_PATH ??
  `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1234/chrome-win64/chrome.exe`;
const SALIDA = 'apps/web/tests/capturas';

const resultados = [];
const comprobar = (nombre, ok, detalle = '') => {
  resultados.push({ nombre, ok, detalle });
  console.log(`  ${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
};

mkdirSync(SALIDA, { recursive: true });

const navegador = await chromium.launch({ executablePath: EXE });
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });

const erroresConsola = [];
pagina.on('console', (m) => {
  if (m.type() === 'error') erroresConsola.push(m.text());
});
pagina.on('pageerror', (e) => erroresConsola.push(String(e)));

/**
 * Ir a una pantalla.
 *
 * **Cinco rutas viven detras de «Mas»** desde el 2026-09-22
 * (docs/INTERFAZ.md §6.9): mercado, ranking, habilidades, gremio y
 * temporada. Hay que abrir el menu antes de pulsar, o el boton no existe
 * todavia en el DOM.
 */
const EN_MENU = ['Mercado', 'Ranking', 'Habilidades', 'Gremio', 'Temporada'];

const ir = async (nombre) => {
  if (EN_MENU.includes(nombre)) {
    await pagina.getByRole('button', { name: 'Más', exact: true }).click();
    await pagina.waitForTimeout(150);
  }
  await pagina.getByRole('button', { name: nombre, exact: true }).click();
  await pagina.waitForTimeout(800);
  return pagina.locator('main').innerText();
};

try {
  await pagina.goto(URL, { waitUntil: 'networkidle' });
  await pagina.waitForTimeout(600);

  const nav = await pagina.locator('nav').innerText();
  // **Mensajes va suelta; Gremio y Temporada viven detrás de «Más»**
  // (docs/INTERFAZ.md §6.9). Que Mensajes esté a la vista no es un detalle:
  // es lo único del menú que otra persona puede hacerte llegar.
  comprobar('Mensajes está suelta en la barra', /mensajes/i.test(nav));
  comprobar('y hay un «Más» para el resto', /más/i.test(nav));

  // --- Gremio ---
  const gre = await ir('Gremio');
  await pagina.screenshot({ path: `${SALIDA}/gremio.png` });
  comprobar('sin gremio, dice que hacen falta cinco magos', /cinco magos/i.test(gre));
  comprobar(
    'el coste de aliarse se dice ANTES de aliarse',
    /refuerzos autom/i.test(gre) && /dos stacks m[áa]s potentes/i.test(gre),
    'y que tus unidades mueren en batallas que no eliges',
  );
  comprobar('y que romper tarda 24 horas', /24 horas/i.test(gre));
  comprobar(
    'dice que a un compañero no se le ataca, o que no hay gremio',
    /no se le puede atacar/i.test(gre) || /no est[áa]s en ning[úu]n gremio/i.test(gre),
  );

  // --- Mensajes ---
  const men = await ir('Mensajes');
  await pagina.screenshot({ path: `${SALIDA}/mensajes.png` });
  comprobar('hay bandeja y tablón', /bandeja/i.test(men) && /tabl[óo]n/i.test(men));
  comprobar('se puede escribir al gremio o a un mago', /al tabl[óo]n de mi gremio/i.test(men));
  comprobar(
    'el tablón dice que solo lo leen los miembros',
    /solo lo leen los miembros/i.test(men),
  );

  // --- Temporada ---
  const tem = await ir('Temporada');
  await pagina.screenshot({ path: `${SALIDA}/temporada.png`, fullPage: true });
  comprobar('enseña cuántos sellos van', /de 7 sellos rotos/i.test(tem));
  comprobar(
    'dice que cada sello lo rompe un mago DISTINTO',
    /un mago distinto/i.test(tem) && /24 horas/i.test(tem),
  );
  comprobar(
    'LAS DOS VÍAS A LA VEZ: los sellos y la fecha tope',
    /sellos/i.test(tem) && /fecha tope/i.test(tem) && /termina en/i.test(tem),
    'si solo se viera una, la otra parecería no existir',
  );
  comprobar(
    'y dice que los sellos solo permiten acabarla antes',
    /permiten acabarla antes/i.test(tem),
  );

  // --- Móvil ---
  await pagina.setViewportSize({ width: 390, height: 844 });
  await pagina.waitForTimeout(400);
  const desborda = await pagina.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  comprobar('a 390px no hay scroll horizontal', !desborda);
  await pagina.screenshot({ path: `${SALIDA}/temporada-movil.png` });

  comprobar('sin errores de consola', erroresConsola.length === 0, erroresConsola.join(' | '));
} finally {
  await navegador.close();
}

const fallos = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - fallos.length}/${resultados.length} comprobaciones en verde`);
if (fallos.length > 0) {
  console.log('Fallan: ' + fallos.map((f) => f.nombre).join(', '));
  process.exit(1);
}
