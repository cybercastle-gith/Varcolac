# -*- coding: utf-8 -*-
"""
Fatia a folha do Bloco 4 (ícones das 24 funções, xilogravura, fundo verde-croma)
em `assets/images/ChatGPT Image 11 de set. de 2026, 13_16_53.png`.

A folha saiu em grade 5 x 5 (24 ícones + 1 célula vazia), não 6 x 4 como o
prompt pedia -- o gerador não respeita proporção pedida, mesma observação já
registrada em `fatiar-assets.py`. Alguns ícones são desenhados como DOIS
blobs desconectados (as duas pegadas do Detetive, o dente partido do Lobo
Branco, os dois frascos da Bruxa, o selo partido do Coringa, a pena +
rabisco do Vingador) -- por isso as caixas abaixo foram medidas por
componente conexo (ver histórico) e unidas manualmente onde o ícone é uma
peça só conceitualmente. A ordem é a do próprio documento: esquerda para
direita, cima para baixo -- é a ordem que também bate com os ids do engine.
"""
import os

import numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTRADA = os.path.join(
    RAIZ, 'assets', 'images', 'ChatGPT Image 11 de set. de 2026, 13_16_53.png'
)
DESTINOS = [
    os.path.join(RAIZ, 'assets', 'icons', 'roles'),
    os.path.join(RAIZ, 'apps', 'mobile', 'assets', 'roles'),
]

# (id do engine, caixa (x0, y0, x1, y1) na folha original)
ICONES = [
    ('aldeao', (37, 44, 179, 281)),
    ('vidente', (247, 61, 429, 270)),
    ('detetive', (487, 72, 667, 269)),
    ('medico', (778, 50, 889, 274)),
    ('guarda-costas', (1018, 60, 1167, 280)),
    ('xerife', (51, 318, 155, 518)),
    ('necromante', (249, 329, 421, 516)),
    ('padre', (527, 308, 634, 522)),
    ('cacador', (735, 311, 885, 522)),
    ('taverneiro', (975, 342, 1175, 521)),
    ('ancia', (48, 555, 172, 793)),
    ('lobo', (298, 578, 373, 758)),
    ('alfa', (491, 567, 648, 770)),
    ('feiticeiro', (771, 551, 887, 779)),
    ('lobo-carnical', (984, 577, 1180, 765)),
    ('lobo-sombra', (46, 813, 140, 1011)),
    ('uivador', (262, 827, 439, 994)),
    ('lobo-branco', (525, 827, 631, 998)),
    ('bruxa', (729, 828, 912, 1011)),
    ('ladrao', (992, 826, 1162, 1010)),
    ('coringa', (83, 1077, 274, 1237)),
    ('sobrevivente', (416, 1065, 588, 1248)),
    ('bobo', (727, 1066, 844, 1258)),
    ('vingador', (952, 1046, 1134, 1249)),
]

PADDING = 14


def verde_croma(a):
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    return (g > 90) & (g.astype(int) - r > 45) & (g.astype(int) - b > 45)


def chave_de_cor(recorte):
    """Mesma lógica de `fatiar-assets.py`: alfa gradual na franja, sem verde residual."""
    a = np.asarray(recorte.convert('RGB')).astype(np.float32)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    excesso = g - np.maximum(r, b)
    alfa = np.clip((60.0 - excesso) / 45.0, 0.0, 1.0)
    g2 = np.where(excesso > 0, np.minimum(g, np.maximum(r, b)), g)
    rgba = np.dstack([r, g2, b, alfa * 255.0]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')


def recortar_conteudo(rgba, folga=4):
    alfa = np.asarray(rgba)[:, :, 3]
    ys, xs = np.where(alfa > 12)
    if len(xs) == 0:
        return rgba
    x0, x1 = max(0, xs.min() - folga), min(rgba.width, xs.max() + 1 + folga)
    y0, y1 = max(0, ys.min() - folga), min(rgba.height, ys.max() + 1 + folga)
    return rgba.crop((x0, y0, x1, y1))


def main():
    img = Image.open(ENTRADA)
    w, h = img.size

    for pasta in DESTINOS:
        os.makedirs(pasta, exist_ok=True)

    for role_id, (x0, y0, x1, y1) in ICONES:
        caixa = (
            max(0, x0 - PADDING),
            max(0, y0 - PADDING),
            min(w, x1 + PADDING),
            min(h, y1 + PADDING),
        )
        peca = recortar_conteudo(chave_de_cor(img.crop(caixa)))
        for pasta in DESTINOS:
            peca.save(os.path.join(pasta, f'{role_id}.png'))
        print(f'  {role_id:16s} {peca.size}')

    print(f'\n{len(ICONES)} ícones salvos em:')
    for pasta in DESTINOS:
        print(f'  {pasta}')


if __name__ == '__main__':
    main()
