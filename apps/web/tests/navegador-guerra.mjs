/**
 * La pasada de navegador de la fase 3: `/guerra` y `/batalla/:id`.
 *
 * **Una sola pasada para las tareas 20 y 21**, porque lo caro es arrancar la
 * sesión, no lo que comprueba (docs/ARQUITECTURA.md §6). Pide turno
 * exclusivo, así que no está en la suite de Vitest (docs/AGENTES.md §2).
 *
 * Lo que comprueba es **lo que no se puede calcular sin pintar**: que los
 * tres ataques se vean como tres decisiones, que el coste se diga antes de
 * pinchar, que la previsión sea un rango y no un número, y que la repetición
 * enseñe los términos que se aplicaron y no solo el resultado.
 *
 * Se ejecuta a mano: `node apps/web/tests/navegador-guerra.mjs`.
 */

import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const URL = process.env.WEB_URL ?? 'http://localhost:3001';
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

const navegador = await chromium.launch({ executablePath: EXE });
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });

const erroresConsola = [];
pagina.on('console', (m) => {
  if (m.type() === 'error') erroresConsola.push(m.text());
});
pagina.on('pageerror', (e) => erroresConsola.push(String(e)));

try {
  await pagina.goto(URL, { waitUntil: 'networkidle' });
  await pagina.getByRole('button', { name: 'Guerra' }).click();
  await pagina.waitForTimeout(700);
  await pagina.screenshot({ path: `${SALIDA}/guerra-lista.png` });

  // 1. La pantalla existe y lista objetivos.
  const texto = await pagina.locator('main').innerText();
  comprobar('aparece la lista de objetivos', /a qui[eé]n atacar/i.test(texto));
  comprobar('el rival sale con su tierra y su net power', /Malakar/.test(texto) && /net power/.test(texto));

  // 2. El coste se dice ANTES de pinchar nada.
  comprobar(
    'el coste del ataque se dice antes de elegir',
    /mantenimiento de todas ellas/.test(texto) && /geld/.test(texto),
    'upkeep del ejército entero',
  );

  // 3. Los tres ataques, tres decisiones visibles.
  await pagina.getByRole('button', { name: /Malakar/ }).click();
  await pagina.waitForTimeout(400);
  const conObjetivo = await pagina.locator('main').innerText();
  const tres = ['Ataque regular', 'Asedio', 'Saqueo'].every((t) => conObjetivo.includes(t));
  comprobar('los tres ataques se ven como tres botones', tres);
  comprobar(
    'cada uno dice qué se lleva y qué cuesta',
    /5% de su tierra/.test(conObjetivo) &&
      /10% de su tierra/.test(conObjetivo) &&
      /dos tercios/.test(conObjetivo),
  );

  // 4. La previsión es un RANGO, no un número.
  comprobar(
    'la previsión va con rango, no con un número exacto',
    /entre/.test(conObjetivo) && /un tercio y el doble/.test(conObjetivo),
  );
  await pagina.screenshot({ path: `${SALIDA}/guerra-ataques.png` });

  // 5. Atacar de verdad, y que la repetición se pueda abrir.
  await pagina.getByRole('button', { name: 'Asedio', exact: true }).click();
  await pagina.waitForTimeout(1500);
  const trasAtacar = await pagina.locator('main').innerText();
  comprobar('tras atacar se abre la repetición', /Batalla #\d+/i.test(trasAtacar));
  await pagina.screenshot({ path: `${SALIDA}/guerra-tras-atacar.png` });

  const hayBatalla = /Batalla #\d+/i.test(trasAtacar);
  comprobar('la batalla se abre sola tras atacar', hayBatalla);

  if (hayBatalla) {
    const rep = trasAtacar;
    await pagina.screenshot({ path: `${SALIDA}/batalla-repeticion.png`, fullPage: true });

    comprobar('la repetición se abre y dice quién ganó', /ganó el/.test(rep));
    comprobar('enseña la semilla, que es lo que la hace comprobable', /Semilla/.test(rep));
    comprobar('va ronda a ronda', /ronda 1/i.test(rep));
    // **Lo que distingue esto de una animación bonita.**
    comprobar(
      'cada golpe enseña los términos que se le aplicaron',
      /acierto \d+/i.test(rep) && /azar \d/i.test(rep) && /eficiencia \d+/i.test(rep),
      'acierto, azar y eficiencia',
    );
    comprobar('dice cuánta tierra se destruyó, no solo la robada', /destruyeron/.test(rep));
    // Nombres, no ids internos: ya se coló una vez en la fase 1.
    comprobar(
      'las unidades salen con su nombre, no con su id',
      /Milicia|Caballer[ií]a|Arquero/.test(rep) && !/militia/.test(rep),
    );
    comprobar(
      'no hay rondas de relleno con todo a cero',
      !/0 bajas — acierto \d+, azar [\d.]+, eficiencia 0/.test(rep),
      'la batalla termina cuando los dos bandos se agotan',
    );

    // 6. Volver funciona.
    await pagina.getByRole('button', { name: 'Volver a la guerra' }).click();
    await pagina.waitForTimeout(500);
    comprobar(
      'se puede volver a la guerra',
      /a qui[eé]n atacar/i.test(await pagina.locator('main').innerText()),
    );
  }

  // 7. Móvil: sin scroll horizontal (docs/INTERFAZ.md).
  await pagina.setViewportSize({ width: 390, height: 844 });
  await pagina.waitForTimeout(400);
  const desborda = await pagina.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  comprobar('a 390px no hay scroll horizontal', !desborda);
  await pagina.screenshot({ path: `${SALIDA}/guerra-movil.png` });

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
