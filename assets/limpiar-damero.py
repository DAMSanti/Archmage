# -*- coding: utf-8 -*-
"""
Quita el damero falso de un icono y lo deja con alfa de verdad.

    python assets/limpiar-damero.py Blanco:ascendant Rojo:eradication ...

El generador entrega JPEG, que no tiene canal alfa, asi que lo que parece
transparencia esta PINTADO en los pixeles — y **cada generacion lo pinta en un
tono distinto**. Medido en las seis: blanco, gris claro, gris medio, gris
oscuro y negro, todos diferentes.

El discriminador no es el color: es que **el damero alterna dos tonos**. Una
region de fondo contiene los dos; una mancha solida del dibujo, uno solo. Sin
eso, con tolerancia suficiente para coger los bordes suavizados, el 57% del
craneo de Nether se borraba por ser casi tan oscuro como su propio damero.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

TOL = 20
# Cuanto puede separarse un canal de otro y seguir siendo «gris».
CHROMA_MAX = 16
MASTER = 512
MIN_REGION = 2000


def tonos_del_borde(a):
    """
    Los dos tonos del damero, de una **banda ancha** del borde.

    **La primera version muestreaba tres filas de pixeles y fallaba**: en los
    iconos cuyos dos tonos se parecen —#f8f8f8 y #e0e0e0— las tres filas caian
    casi siempre en el mismo cuadro y solo encontraba uno. Con el 5% del lado
    aparecen los dos siempre.
    """
    h, w, _ = a.shape
    m = max(4, int(min(h, w) * 0.05))
    banda = np.concatenate([
        a[:m].reshape(-1, 3), a[-m:].reshape(-1, 3),
        a[:, :m].reshape(-1, 3), a[:, -m:].reshape(-1, 3),
    ])
    # Se cuantiza para que el ruido del JPEG no parta un tono en veinte.
    q = banda // 8 * 8
    cols, cnt = np.unique(q, axis=0, return_counts=True)
    orden = np.argsort(-cnt)
    primero = cols[orden[0]]
    for i in orden[1:]:
        if np.abs(cols[i].astype(int) - primero.astype(int)).max() > 15:
            return primero.astype(np.int16), cols[i].astype(np.int16)
    # Un fondo de un solo tono es legitimo: entonces no hay que discriminar.
    return primero.astype(np.int16), primero.astype(np.int16)


def mascara_de_fondo(a, t1, t2):
    """
    Fondo = **gris puro y dentro del rango de los dos tonos del damero**.

    La primera version pedia «parecerse a uno de los dos tonos», y dejaba
    fuera **las lineas de transicion entre cuadros**: no son ninguno de los
    dos, forman una malla conectada por toda la imagen, y sobreviven al filtro
    de tamano. Con eso el recorte al contenido salia del lienzo entero.

    Lo que si es cierto de las seis generaciones: **el damero siempre es
    acromatico** —R=G=B— y los dibujos llevan color. Un gris intermedio entre
    dos cuadros sigue siendo gris, asi que la malla entra sola.

    Y el rango de luminancia protege lo que es gris pero no es damero: el
    contorno casi negro de Ascendant es acromatico, pero su luminancia (8)
    cae muy por debajo del damero (48-104), asi que no se toca.
    """
    chroma = a.max(axis=2) - a.min(axis=2)
    lum = a.mean(axis=2)
    lo, hi = float(min(t1.mean(), t2.mean())), float(max(t1.mean(), t2.mean()))
    fondo = (chroma <= CHROMA_MAX) & (lum >= lo - TOL) & (lum <= hi + TOL)

    # **Limpieza del moteado.** El JPEG deja artefactos en los bordes del
    # damero: pixeles sueltos, invisibles, que bastan para que el recorte al
    # contenido salga del lienzo entero. Se limpia por TAMANO, no por color.
    frente = ~fondo
    et, n = ndimage.label(frente)
    if n:
        tam = ndimage.sum_labels(frente, et, range(1, n + 1))
        grande = np.zeros(n + 1, dtype=bool)
        grande[1:] = tam >= MIN_REGION
        frente = grande[et]

    # Y al reves: agujeros diminutos dentro del dibujo. Los huecos de verdad
    # —el centro de un anillo— son grandes y se quedan.
    et, n = ndimage.label(~frente)
    if n:
        tam = ndimage.sum_labels(~frente, et, range(1, n + 1))
        chico = np.zeros(n + 1, dtype=bool)
        chico[1:] = tam < MIN_REGION
        frente |= chico[et]

    return ~frente


def procesar(origen, destino, salida='assets'):
    im = Image.open('assets/%s.jfif' % origen).convert('RGB')
    a = np.asarray(im).astype(np.int16)
    t1, t2 = tonos_del_borde(np.asarray(im))
    fondo = mascara_de_fondo(a, t1, t2)

    # **Sangrado de color.** Los pixeles de fondo toman el color del pixel de
    # dibujo mas cercano. Sin esto, al reducir, los bordes mezclan con el
    # damero y sale una orla del color del fondo que ya no existe.
    _, idx = ndimage.distance_transform_edt(fondo, return_indices=True)
    rgb = np.asarray(im)[idx[0], idx[1]]
    alfa = np.where(fondo, 0, 255).astype(np.uint8)

    ys, xs = np.where(~fondo)
    if len(ys) == 0:
        sys.exit('%s: no queda nada tras quitar el fondo' % origen)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    lado = max(y1 - y0, x1 - x0)
    lado += int(lado * 0.04) * 2
    cy, cx = (y0 + y1) // 2, (x0 + x1) // 2

    lienzo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    pieza = Image.fromarray(np.dstack([rgb, alfa]).astype(np.uint8), 'RGBA')
    lienzo.paste(pieza, (lado // 2 - cx, lado // 2 - cy))
    fin = lienzo.resize((MASTER, MASTER), Image.LANCZOS)
    fin.save('%s/%s.png' % (salida, destino), optimize=True)
    fin.save('%s/%s.webp' % (salida, destino), quality=92, method=6)

    print('%-12s damero #%02x%02x%02x/#%02x%02x%02x  fondo %4.1f%%  contenido %dx%d'
          % (origen + '->' + destino, t1[0], t1[1], t1[2], t2[0], t2[1], t2[2],
             fondo.mean() * 100, x1 - x0, y1 - y0))
    return fin


if __name__ == '__main__':
    for par in sys.argv[1:]:
        o, d = par.split(':')
        procesar(o, d)
