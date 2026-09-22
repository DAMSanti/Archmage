# -*- coding: utf-8 -*-
"""
Ajusta el icono de Verdant a su token.

**No es retoque de gusto: el documento dice de que color es.**
`docs/INTERFAZ.md §6.3` fija `--escuela-verdant` en `#4e9e4a`, y la generacion
salio por debajo — su percentil 99 es `#5e9a5b` y su mediana `#35573c`. Sobre
`--panel` (`#1e1813`) eso da 2,26:1 de contraste medio, cuando Negro da 3,11 y
su reborde llega a 8,83.

Se sube la luminancia **en luz lineal** (no sobre el sRGB directamente, que
desaturaria) hasta que el percentil 75 del icono coincida con la luminancia
del token. El tono se conserva: se escala el brillo, no el color.

Lo que esto NO arregla, y hay que decirlo: **la densidad de detalle**. Las
runas y las enredaderas siguen siendo demasiado finas para 24px, y eso no se
corrige con ganancia — se corrige generando otra vez con un motivo mas simple.
"""
import sys
import numpy as np
from PIL import Image

SALIDA = sys.argv[1]
TOKEN_VERDANT = (0x4e, 0x9e, 0x4a)
PANEL = (0x1e, 0x18, 0x13)


def a_lineal(c):
    c = np.asarray(c, dtype=float) / 255.0
    return np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)


def a_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= .0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - .055) * 255.0


def lum(c_lineal):
    return .2126 * c_lineal[..., 0] + .7152 * c_lineal[..., 1] + .0722 * c_lineal[..., 2]


def contraste(L1, L2):
    return (max(L1, L2) + .05) / (min(L1, L2) + .05)


im = Image.open('%s/verde.png' % SALIDA).convert('RGBA')
a = np.asarray(im).astype(float)
rgb, alfa = a[..., :3], a[..., 3]
vis = alfa > 200

lin = a_lineal(rgb)
L = lum(lin)
objetivo = lum(a_lineal(TOKEN_VERDANT))
actual = np.percentile(L[vis], 75)
ganancia = objetivo / actual
print('luminancia objetivo (token) %.4f | actual p75 %.4f | ganancia x%.2f'
      % (objetivo, actual, ganancia))

lin_out = lin * ganancia
fuera = (lin_out > 1).any(axis=2) & vis
print('pixeles que se saturarian: %.2f%%' % (fuera.sum() / max(vis.sum(), 1) * 100))

rgb_out = a_srgb(lin_out)
salida = np.dstack([rgb_out, alfa]).astype(np.uint8)
Image.fromarray(salida, 'RGBA').save('%s/verde_ajustado.png' % SALIDA, optimize=True)

# Y se vuelve a medir, que es lo unico que dice si sirvio.
lp = lum(a_lineal(PANEL))
Lout = lum(a_lineal(rgb_out))[vis]
print('  contraste medio  %.2f:1  (antes 2.26)' % contraste(Lout.mean(), lp))
print('  su 10%% mas claro %.2f:1  (antes 3.87, Negro 8.83)'
      % contraste(np.percentile(Lout, 90), lp))
px = rgb_out[vis]
for p in (50, 90, 99):
    v = np.percentile(px, p, axis=0)
    print('  percentil %2d -> #%02x%02x%02x' % (p, int(v[0]), int(v[1]), int(v[2])))
