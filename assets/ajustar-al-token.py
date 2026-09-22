# -*- coding: utf-8 -*-
"""
Sube un icono a la luminancia de su token cuando la generacion salio oscura.

    python assets/ajustar-al-token.py verdant:#4e9e4a

**No es retoque de gusto: el documento dice de que color es.**
`docs/INTERFAZ.md §6.3` fija el token de cada escuela, y una generacion puede
salir por debajo — Verdant llego con su mediana en `#35573c` y su percentil 99
en `#5e9a5b`, cuando su token es `#4e9e4a`. Sobre `--panel` eso daba 2,26:1.

Se sube en **luz lineal**, no sobre el sRGB directamente, que desaturaria, y
hasta que el percentil 75 del icono coincida con la luminancia del token. El
tono se conserva: se escala el brillo, no el color.

**No se aplica por sistema.** Medidas del 2026-09-22: de las seis, solo
Verdant lo necesitaba. Las otras cinco llegan a su token en su parte clara, y
tocarlas seria empeorarlas.

Lo que esto NO arregla: **la densidad de detalle**. Un icono con adornos finos
sigue siendo ilegible a 24px por mucha ganancia que se le meta — eso se
corrige generando otra vez con menos elementos dentro.
"""
import sys
import numpy as np
from PIL import Image

PANEL = (0x1e, 0x18, 0x13)


def a_lineal(c):
    c = np.asarray(c, dtype=float) / 255.0
    return np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)


def a_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= .0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - .055) * 255.0


def lum(lineal):
    return .2126 * lineal[..., 0] + .7152 * lineal[..., 1] + .0722 * lineal[..., 2]


def contraste(a, b):
    return (max(a, b) + .05) / (min(a, b) + .05)


def ajustar(nombre, token, salida='assets'):
    rgb_token = tuple(int(token.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
    im = Image.open('%s/%s.png' % (salida, nombre)).convert('RGBA')
    a = np.asarray(im).astype(float)
    rgb, alfa = a[..., :3], a[..., 3]
    vis = alfa > 200

    lin = a_lineal(rgb)
    objetivo = float(lum(a_lineal(rgb_token)))
    actual = float(np.percentile(lum(lin)[vis], 75))
    ganancia = objetivo / actual

    lin_out = lin * ganancia
    saturan = float(((lin_out > 1).any(axis=2) & vis).sum()) / max(vis.sum(), 1) * 100
    rgb_out = a_srgb(lin_out)

    lp = float(lum(a_lineal(PANEL)))
    antes = lum(a_lineal(rgb))[vis]
    despues = lum(a_lineal(rgb_out))[vis]
    print('%-12s ganancia x%.2f | satura %.2f%% | contraste %.2f -> %.2f | claro %.2f -> %.2f'
          % (nombre, ganancia, saturan,
             contraste(float(antes.mean()), lp), contraste(float(despues.mean()), lp),
             contraste(float(np.percentile(antes, 90)), lp),
             contraste(float(np.percentile(despues, 90)), lp)))

    fin = Image.fromarray(np.dstack([rgb_out, alfa]).astype(np.uint8), 'RGBA')
    fin.save('%s/%s.png' % (salida, nombre), optimize=True)
    fin.save('%s/%s.webp' % (salida, nombre), quality=92, method=6)


if __name__ == '__main__':
    for par in sys.argv[1:]:
        n, t = par.split(':')
        ajustar(n, t)
