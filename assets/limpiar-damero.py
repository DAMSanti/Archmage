# -*- coding: utf-8 -*-
"""
Quita el damero falso de los dos iconos y los deja con alfa de verdad.

El generador entrego JPEG, que no tiene canal alfa, asi que lo que parece
transparencia esta PINTADO en los pixeles — y cada generacion lo pinto en un
tono distinto. De ahi que «tengan fondos diferentes».

El discriminador no es el color: es que **el damero alterna dos tonos**. Una
region de fondo contiene los dos; el craneo solido de Negro, uno solo. Sin
eso, con tolerancia suficiente para coger los bordes suavizados, el craneo se
borra: medido, el 57% del centro del sigilo.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

SALIDA = sys.argv[1]
TOL = 20
MASTER = 512


def tonos_del_borde(a):
    """Los dos tonos del damero, sacados del borde: ahi solo hay fondo."""
    borde = np.concatenate([
        a[:3].reshape(-1, 3), a[-3:].reshape(-1, 3),
        a[:, :3].reshape(-1, 3), a[:, -3:].reshape(-1, 3),
    ])
    cols, cuenta = np.unique(borde, axis=0, return_counts=True)
    orden = np.argsort(-cuenta)
    primero = cols[orden[0]]
    # El segundo tono tiene que ser DISTINTO del primero, no una variacion
    # suya por compresion JPEG.
    for i in orden[1:]:
        if np.abs(cols[i].astype(int) - primero.astype(int)).max() > 25:
            return primero, cols[i]
    raise SystemExit('no encuentro dos tonos de damero')


def mascara_de_fondo(a, t1, t2):
    d1 = np.abs(a - t1.astype(np.int16)).max(axis=2)
    d2 = np.abs(a - t2.astype(np.int16)).max(axis=2)
    cerca1, cerca2 = d1 < TOL, d2 < TOL
    candidato = cerca1 | cerca2

    # **La comprobacion que salva el craneo.** Se etiquetan las regiones
    # candidatas y solo sobreviven las que contienen LOS DOS tonos: eso es un
    # damero. Una mancha de craneo oscuro solo contiene uno.
    etiquetas, n = ndimage.label(candidato)
    tiene1 = ndimage.sum_labels(cerca1, etiquetas, range(1, n + 1))
    tiene2 = ndimage.sum_labels(cerca2, etiquetas, range(1, n + 1))
    tam = ndimage.sum_labels(candidato, etiquetas, range(1, n + 1))

    bueno = np.zeros(n + 1, dtype=bool)
    for i in range(n):
        # Los dos tonos presentes y ninguno testimonial, y region no minuscula.
        if tam[i] >= 200 and min(tiene1[i], tiene2[i]) >= 0.12 * tam[i]:
            bueno[i + 1] = True
    fondo = bueno[etiquetas]

    # **Limpieza del moteado.** El JPEG deja artefactos de compresion en los
    # bordes del damero: pixeles sueltos que no se parecen a ninguno de los
    # dos tonos. Son invisibles y bastan para que el recorte al contenido
    # salga del lienzo entero — que es justo lo que paso la primera vez.
    #
    # Se limpia por TAMANO, no por color: el sigilo es una mancha grande y
    # conexa, y el moteado son islas de unos pocos pixeles.
    frente = ~fondo
    et, n = ndimage.label(frente)
    if n:
        tam = ndimage.sum_labels(frente, et, range(1, n + 1))
        grande = np.zeros(n + 1, dtype=bool)
        grande[1:] = tam >= 2000
        frente = grande[et]

    # Y al reves: agujeros diminutos DENTRO del sigilo que salieron como
    # fondo. Los huecos de verdad del anillo son grandes y se quedan.
    et, n = ndimage.label(~frente)
    if n:
        tam = ndimage.sum_labels(~frente, et, range(1, n + 1))
        chico = np.zeros(n + 1, dtype=bool)
        chico[1:] = tam < 2000
        frente |= chico[et]

    return ~frente


def procesar(nombre):
    im = Image.open('assets/%s.jfif' % nombre).convert('RGB')
    a = np.asarray(im).astype(np.int16)
    t1, t2 = tonos_del_borde(np.asarray(im))
    fondo = mascara_de_fondo(a, t1, t2)
    print('%s: damero #%02x%02x%02x / #%02x%02x%02x  -> fondo %.1f%%'
          % (nombre, t1[0], t1[1], t1[2], t2[0], t2[1], t2[2], fondo.mean() * 100))

    # **Sangrado de color.** Los pixeles de fondo toman el color del pixel de
    # sigilo mas cercano. Sin esto, al reducir, los bordes mezclan con el
    # blanco o el gris del damero y sale una orla.
    _, idx = ndimage.distance_transform_edt(fondo, return_indices=True)
    rgb = np.asarray(im)[idx[0], idx[1]]

    alfa = np.where(fondo, 0, 255).astype(np.uint8)

    # Recorte al contenido, y cuadrado: un icono no cuadrado se deforma en
    # cuanto alguien le pone width y height iguales.
    ys, xs = np.where(~fondo)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    lado = max(y1 - y0, x1 - x0)
    margen = int(lado * 0.04)
    lado += margen * 2
    cy, cx = (y0 + y1) // 2, (x0 + x1) // 2
    print('   contenido %dx%d en un lienzo de %dx%d -> cuadrado de %d'
          % (x1 - x0, y1 - y0, im.size[0], im.size[1], lado))

    lienzo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    pieza = Image.fromarray(np.dstack([rgb, alfa]).astype(np.uint8), 'RGBA')
    lienzo.paste(pieza, (lado // 2 - cx, lado // 2 - cy))

    fin = lienzo.resize((MASTER, MASTER), Image.LANCZOS)
    fin.save('%s/%s.png' % (SALIDA, nombre.lower()), optimize=True)
    fin.save('%s/%s.webp' % (SALIDA, nombre.lower()), quality=90, method=6)
    return fin


for n in ['Verde', 'Negro']:
    procesar(n)
print('listo')
