/**
 * La pasada de navegador de la fase 4: portal, habilidades, mercado y
 * ranking.
 *
 * **Una sola pasada para las cuatro pantallas**, porque lo caro es arrancar
 * la sesión, no lo que comprueba (docs/ARQUITECTURA.md §6). Pide turno
 * exclusivo (docs/AGENTES.md §2).
 *
 * Lo que comprueba es **lo que no se puede calcular sin pintar**: que el
 * mercado diga sus cuatro avisos antes de pinchar, que diga por qué está
 * vacío en vez de parecer roto, que las habilidades expliquen **qué cambian
 * en números**, y que el ranking no enseñe ejército ni geld.
 *
 * Se ejecuta a mano: `node apps/web/tests/navegador-mundo.mjs`.
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

  // 1. Las tres viven detrás de «Más» desde el 2026-09-22
  //    (docs/INTERFAZ.md §6.9): once entradas sueltas no caben a 360px.
  //    Se comprueba que el menú **las lleve**, no que estén en la barra.
  await pagina.getByRole('button', { name: 'Más', exact: true }).click();
  await pagina.waitForTimeout(200);
  const menu = await pagina.locator('.marco__menu').innerText();
  comprobar(
    'el menú «Más» lleva Mercado, Habilidades y Ranking',
    /mercado/i.test(menu) && /habilidades/i.test(menu) && /ranking/i.test(menu),
  );
  await pagina.keyboard.press('Escape');

  // 2. Habilidades: qué cambian EN NÚMEROS.
  const hab = await ir('Habilidades');
  await pagina.screenshot({ path: `${SALIDA}/habilidades.png` });
  comprobar('las diez habilidades se listan', (hab.match(/nivel \d+\/20/g) ?? []).length === 10);
  comprobar(
    'dicen qué cambian en números, no «mejora tus tropas»',
    /coste de man|acierto en batalla|tierra arrancada/i.test(hab),
  );
  comprobar(
    'el doble coste fuera de color va EN LA FILA',
    /cuesta el doble fuera de tu color/i.test(hab),
  );
  comprobar('dicen de dónde salen los puntos', /guilds/i.test(hab) && /210/.test(hab));

  // 3. Mercado: los cuatro avisos, y el vacío explicado.
  const mer = await ir('Mercado');
  await pagina.screenshot({ path: `${SALIDA}/mercado.png` });
  comprobar('avisa de que pujar cuesta un turno', /pujar cuesta un turno/i.test(mer));
  comprobar('avisa de que el geld se cobra al pujar', /se cobra al pujar/i.test(mer));
  comprobar('avisa de que no se puede cancelar', /no se puede cancelar/i.test(mer));
  comprobar('dice el incremento mínimo', /5%/.test(mer));
  comprobar(
    'CUANDO ESTÁ VACÍO LO DICE, en vez de parecer roto',
    /no hay nada a la venta/i.test(mer),
    'vacío ≠ no ha cargado',
  );

  // 4. Ranking: net power sí, ejército y geld no.
  const ran = await ir('Ranking');
  await pagina.screenshot({ path: `${SALIDA}/ranking.png` });
  comprobar('el ranking lista magos con su net power', /net power/i.test(ran));
  comprobar('y su escuela y su tierra', /acres/i.test(ran));
  comprobar(
    'NO enseña ejército ni geld',
    !/ejército:|unidades|geld/i.test(ran),
    'saberlo convertiría la guerra en aritmética',
  );

  // 5. Móvil.
  await pagina.setViewportSize({ width: 390, height: 844 });
  await pagina.waitForTimeout(400);
  const desborda = await pagina.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  comprobar('a 390px no hay scroll horizontal', !desborda);
  await pagina.screenshot({ path: `${SALIDA}/mundo-movil.png` });

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
