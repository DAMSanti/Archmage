# -*- coding: utf-8 -*-
"""
Prepara el fondo de una barra del marco.

    python assets/preparar-barra.py Superior:marco-arriba:abajo:72
                                    Inferior:marco-abajo:arriba:48

Hace tres cosas, y las tres salen de una medida, no de mirarlo:

1. **Recorta los bordes verticales.** El fondo se repite en horizontal
   (`repeat-x`), asi que un filete vertical pintado en los lados saldria una
   vez por cada repeticion, como una reja. Se detecta por columnas claras en
   el margen, no se supone.

2. **Baja los pixeles que se pasan del tope de contraste**, y solo esos.
   `docs/ASSETS.md §8.1`: en el cuerpo de la barra no puede haber nada por
   encima de la luminancia con la que `--texto-tenue` (#a8987e) sigue
   llegando a 4,5:1. Se recorta **por pixel**, en luz lineal: lo oscuro no se
   toca y solo se aplana el 3% que brilla de mas.

   Bajar la imagen entera con una ganancia habria matado la textura —medido:
   habria hecho falta multiplicar por 0,15—, y el problema no es la textura,
   son sus reflejos.

3. **El riel se queda intacto.** No lleva texto encima, asi que puede
   brillar todo lo que quiera; es lo que hace que la barra se lea como un
   marco y no como una linea.
"""
import os
import sys
import numpy as np
from PIL import Image

# Luminancia maxima del cuerpo. docs/ASSETS.md §8.1.
TOPE = 0.0329
# Fraccion del alto que ocupa el riel.
RIEL = 0.20


def a_lineal(c):
    c = np.asarray(c, dtype=float) / 255.0
    return np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)


def a_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= .0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - .055) * 255.0


def lum(v):
    return .2126 * v[..., 0] + .7152 * v[..., 1] + .0722 * v[..., 2]


def recortar_lados(a, L):
    """Quita el filete vertical de los lados, si lo hay."""
    col = L.mean(axis=0)
    w = len(col)
    medio = float(np.median(col[int(w * .2):int(w * .8)]))
    # Un lado es filete mientras sea mucho mas claro que el centro.
    izq = 0
    while izq < int(w * .12) and col[izq] > medio * 2.5:
        izq += 1
    der = w - 1
    while der > int(w * .88) and col[der] > medio * 2.5:
        der -= 1
    return izq, der + 1


def preparar(origen, destino, riel, alto_css, salida='assets'):
    im = Image.open('%s/%s.jfif' % (salida, origen)).convert('RGB')
    a = np.asarray(im).astype(float)
    L = lum(a_lineal(a))
    h, w = L.shape

    x0, x1 = recortar_lados(a, L)
    if x0 or x1 != w:
        print('   recortados %d px por la izquierda y %d por la derecha' % (x0, w - x1))
    a, L = a[:, x0:x1], L[:, x0:x1]

    # Mascara del cuerpo, con una transicion suave hacia el riel para que no
    # quede una linea recta donde empieza a aclararse.
    h, w = L.shape
    y = np.arange(h)[:, None] / h
    if riel == 'abajo':
        peso = np.clip((1 - RIEL - y) / 0.06, 0, 1)
    else:
        peso = np.clip((y - RIEL) / 0.06, 0, 1)

    antes = float(L[peso[:, 0] > .5].max())
    exceso = np.maximum(L / TOPE, 1.0)
    factor = 1.0 / (1.0 + (exceso - 1.0) * peso)
    lin = a_lineal(a) * factor[..., None]
    rgb = a_srgb(lin)

    L2 = lum(a_lineal(rgb))
    cuerpo = L2[peso[:, 0] > .5]
    print('   cuerpo: max %.4f -> %.4f (tope %.4f) | por encima: %.2f%%'
          % (antes, float(cuerpo.max()), TOPE, float((cuerpo > TOPE + 1e-6).mean() * 100)))

    # **La pieza se espeja para que repita sin costura.**
    #
    # `repeat-x` pega el borde derecho contra el izquierdo, y los dos bordes
    # de una imagen generada no coinciden: en la primera version se veian
    # bandas verticales en la barra de arriba, y la diferencia medida entre
    # columnas era de 9,1. Pegando la imagen contra su propio espejo, el
    # empalme es simetrico **por construccion** y no hay nada que ajustar.
    #
    # Cuesta el doble de ancho, que en una franja de 144px de alto son tres
    # kilobytes.
    espejo = np.concatenate([rgb, rgb[:, ::-1]], axis=1)
    w2 = espejo.shape[1]
    costura = float(np.abs(espejo[:, 0].astype(int) - espejo[:, -1].astype(int)).mean())
    print('   costura tras espejar: %.1f' % costura)

    alto = alto_css * 2
    fin = Image.fromarray(espejo.astype(np.uint8), 'RGB').resize(
        (max(1, int(w2 * alto / h)), alto), Image.LANCZOS)
    ruta = '%s/%s.webp' % (salida, destino)
    fin.save(ruta, quality=88, method=6)
    print('   %s  %dx%d  %.1f KB' % (ruta, fin.size[0], fin.size[1],
                                     os.path.getsize(ruta) / 1024))


if __name__ == '__main__':
    for par in sys.argv[1:]:
        o, d, r, alto = par.split(':')
        print(o)
        preparar(o, d, r, int(alto))
