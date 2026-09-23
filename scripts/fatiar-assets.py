# -*- coding: utf-8 -*-
"""
Fatia as folhas de contato geradas por IA nos arquivos individuais do app.

As folhas vem em uma imagem so, com varios itens em grade (ver
docs/ASSETS_A_GERAR.md). Este script acha as calhas e corta.

Por que detectar a calha em vez de dividir a largura por 5: o gerador nao
devolve exatamente a proporcao pedida, e as celulas nao ficam com largura
identica. Dividir por geometria corta material da borda de uma celula e sobra
calha na outra. Procurar as linhas de fundo continuo acerta as duas coisas.
"""
import io
import os
import sys

import numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTRADA = os.path.join(RAIZ, 'assets', 'images')


def faixas(mascara_fundo, minimo):
    """
    Converte um vetor booleano "esta linha e toda fundo?" em faixas de conteudo.

    Devolve [(inicio, fim)] de cada trecho continuo de conteudo com pelo menos
    `minimo` pixels — o minimo descarta ruido de compressao na calha.
    """
    out, inicio = [], None
    for i, e_fundo in enumerate(mascara_fundo):
        if not e_fundo and inicio is None:
            inicio = i
        elif e_fundo and inicio is not None:
            if i - inicio >= minimo:
                out.append((inicio, i))
            inicio = None
    if inicio is not None and len(mascara_fundo) - inicio >= minimo:
        out.append((inicio, len(mascara_fundo)))
    return out


def grade(img, e_fundo, minimo_frac=0.25):
    """Acha as colunas e linhas de conteudo de uma folha em grade."""
    a = np.asarray(img.convert('RGB')).astype(np.int16)
    fundo = e_fundo(a)  # matriz booleana HxW
    h, w = fundo.shape
    cols = faixas(fundo.all(axis=0), int(w / 12 * minimo_frac))
    rows = faixas(fundo.all(axis=1), int(h / 12 * minimo_frac))
    return cols, rows


def quase_branco(a):
    return (a > 233).all(axis=2)


def verde_croma(a):
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    return (g > 90) & (g.astype(int) - r > 45) & (g.astype(int) - b > 45)



def aparar_borda(img, tolerancia=14, maximo_frac=0.08):
    """
    Remove a tira de calha que sobra no recorte.

    O detector de grade usa `quase_branco` (`> 233` nos tres canais), e os
    pixels da transicao entre a calha branca e o material caem abaixo disso
    primeiro no canal AZUL — papel e linho sao creme, entao o azul despenca
    antes do vermelho. Resultado: a borda entra no recorte como conteudo.

    Isso passa despercebido enquanto a textura e usada em opacidade baixa, e
    aparece de forma gritante quando ela vai a `resizeMode="repeat"`: cada
    emenda de ladrilho desenha a tira clara, e a superficie ganha uma grade de
    linhas brancas. Foi assim que a carta de funcao ficou com linha branca em
    cima, embaixo e nas laterais.

    Medido em `papel-encardido.png` antes da correcao:

        linha  0   [229.5 205.2 169.7]
        linha  1   [205.5 163.0 105.0]   <- o papel de verdade
        linha -1   [245.6 236.8 223.4]   <- quase branca

    Aqui a referencia e a mediana do MIOLO (60% centrais), e some toda borda
    que se afasta dela mais que `tolerancia`. O teto de 8% por lado evita que
    um material legitimamente claro numa ponta seja comido.
    """
    a = np.asarray(img.convert('RGB')).astype(np.int16)
    h, w = a.shape[:2]
    miolo = a[int(h * 0.2):int(h * 0.8), int(w * 0.2):int(w * 0.8)]
    referencia = np.median(miolo.reshape(-1, 3), axis=0)

    def longe(linha):
        return np.abs(linha.mean(axis=0) - referencia).max() > tolerancia

    topo, base = 0, h
    for _ in range(int(h * maximo_frac)):
        if topo < base and longe(a[topo]):
            topo += 1
        else:
            break
    for _ in range(int(h * maximo_frac)):
        if base - 1 > topo and longe(a[base - 1]):
            base -= 1
        else:
            break

    esq, dir_ = 0, w
    for _ in range(int(w * maximo_frac)):
        if esq < dir_ and longe(a[:, esq]):
            esq += 1
        else:
            break
    for _ in range(int(w * maximo_frac)):
        if dir_ - 1 > esq and longe(a[:, dir_ - 1]):
            dir_ -= 1
        else:
            break

    return img.crop((esq, topo, dir_, base))


def salvar(img, caixa, destino, aparar=True):
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    recorte = img.crop(caixa)
    if aparar:
        recorte = aparar_borda(recorte)
    recorte.save(destino)


def chave_de_cor(recorte):
    """
    Remove o verde-croma e devolve RGBA.

    A borda de um objeto fotografado carrega um pouco do verde do fundo por
    causa do anti-aliasing. Zerar so o que e "bem verde" deixa uma franja; por
    isso o alfa cai de forma gradual na faixa de transicao, e o residuo verde e
    descontado do proprio pixel.
    """
    a = np.asarray(recorte.convert('RGB')).astype(np.float32)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    # Quanto o verde se destaca do maior dos outros dois canais.
    excesso = g - np.maximum(r, b)
    alfa = np.clip((60.0 - excesso) / 45.0, 0.0, 1.0)
    # Desconta a contaminacao verde da borda.
    g2 = np.where(excesso > 0, np.minimum(g, np.maximum(r, b)), g)
    rgba = np.dstack([r, g2, b, alfa * 255.0]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')


def recortar_conteudo(rgba, folga=2):
    """Aperta o recorte na parte visivel, com uma folga de seguranca."""
    alfa = np.asarray(rgba)[:, :, 3]
    ys, xs = np.where(alfa > 12)
    if len(xs) == 0:
        return rgba
    x0, x1 = max(0, xs.min() - folga), min(rgba.width, xs.max() + 1 + folga)
    y0, y1 = max(0, ys.min() - folga), min(rgba.height, ys.max() + 1 + folga)
    return rgba.crop((x0, y0, x1, y1))


MATERIAIS = [
    'linho-cru', 'la-grossa', 'feltro-escuro', 'bordado-vermelho', 'bordado-preto',
    'remendo', 'barbante', 'papel-encardido', 'papel-queimado', 'papel-manchado',
    'manuscrito', 'nogueira', 'entalhe', 'ripa-gasta', 'ferro-oxidado',
    'prata-batida', 'cera', 'sebo', 'osso', 'terra',
]

RECORTES = [
    'chave', 'ferradura', 'prego', 'vela', 'colher',
    'frasco', 'sino', 'cruz', 'faca', 'corda',
    'espelho', 'ossos', 'la', 'dente', 'anel',
    'moeda', 'lamparina', 'machadinha', 'pena-tinteiro', 'selo',
]

FUNDOS = ['noite', 'dia', 'morte', 'vitoria', 'neutro', 'terra']



# As folhas, por NOME e nao por ordem alfabetica.
#
# Isto ja quebrou uma vez: o script pegava `sorted(...)[0], [1], [2]` da pasta
# `assets/images/`. Funcionou enquanto so havia as tres folhas; no momento em
# que o usuario largou ali a folha de icones e um print da logo, "Captura de
# tela ..." virou o primeiro item e o script tentou fatiar um print de 122x150
# como se fosse a folha de 20 materiais.
#
# `assets/images/` e a pasta onde o usuario JOGA imagem nova — tratar a ordem
# dela como contrato e errado por construcao. Folha nova: acrescente aqui.
FOLHAS = {
    'materiais': 'ChatGPT Image 11 de set. de 2026, 12_55_46.png',
    'recortes': 'ChatGPT Image 11 de set. de 2026, 12_58_34.png',
    'fundos': 'ChatGPT Image 11 de set. de 2026, 13_01_27.png',
    # A folha de icones das funcoes tem script proprio, porque a grade dela nao
    # e detectavel: ver `scripts/fatiar-icones-roles.py`.
}


def folha(nome):
    caminho = os.path.join(ENTRADA, FOLHAS[nome])
    if not os.path.exists(caminho):
        sys.exit(
            f'Nao achei a folha de {nome}:\n    {caminho}\n\n'
            'Se o arquivo foi renomeado ou substituido, atualize FOLHAS no topo '
            'deste script. A ordem dos arquivos na pasta nao e usada de proposito.'
        )
    return caminho


def celulas(img, cols, rows, esperado, nome_folha):
    total = len(cols) * len(rows)
    print(f'  {nome_folha}: {len(cols)} colunas x {len(rows)} linhas = {total}')
    if total != esperado:
        print(f'  !! esperava {esperado} celulas. Confira a deteccao de calha.')
    return total == esperado


def main():
    materiais, recortes, fundos = (folha('materiais'), folha('recortes'), folha('fundos'))

    # ── Bloco 1: materiais, calha branca, 5 x 4 ─────────────────────────────
    img = Image.open(materiais)
    cols, rows = grade(img, quase_branco)
    if celulas(img, cols, rows, 20, 'materiais'):
        i = 0
        for y0, y1 in rows:
            for x0, x1 in cols:
                salvar(img, (x0, y0, x1, y1),
                       os.path.join(RAIZ, 'assets', 'textures', MATERIAIS[i] + '.png'))
                i += 1

    # ── Bloco 2: recortes, fundo verde, 5 x 4 ───────────────────────────────
    img = Image.open(recortes)
    a = np.asarray(img.convert('RGB')).astype(np.int16)
    fundo = verde_croma(a)
    h, w = fundo.shape
    cols = faixas(fundo.all(axis=0), int(w / 12 * 0.25))
    print(f'  recortes: {len(cols)} colunas')

    # As linhas sao procuradas DENTRO de cada coluna, e nao na folha inteira.
    # Um objeto alto (o espelho) desce o bastante para encostar na linha de
    # baixo da coluna vizinha: na folha inteira nao sobra nenhuma linha
    # totalmente verde ali, e a grade some. Dentro da coluna, sobra.
    grelha = {}
    for ci, (x0, x1) in enumerate(cols):
        linhas = faixas(fundo[:, x0:x1].all(axis=1), int(h / 12 * 0.25))
        print(f'    coluna {ci + 1}: {len(linhas)} objetos')
        for ri, (y0, y1) in enumerate(linhas):
            grelha[(ri, ci)] = (x0, y0, x1, y1)

    if len(grelha) != 20:
        print(f'  !! esperava 20 recortes, achei {len(grelha)}.')
    else:
        for (ri, ci), caixa in sorted(grelha.items()):
            peca = recortar_conteudo(chave_de_cor(img.crop(caixa)))
            nome = RECORTES[ri * len(cols) + ci]
            destino = os.path.join(RAIZ, 'assets', 'icons', 'recortes', nome + '.png')
            os.makedirs(os.path.dirname(destino), exist_ok=True)
            peca.save(destino)

    # ── Bloco 3: fundos, calha branca, 3 x 2 ────────────────────────────────
    img = Image.open(fundos)
    cols, rows = grade(img, quase_branco)
    if celulas(img, cols, rows, 6, 'fundos'):
        i = 0
        for y0, y1 in rows:
            for x0, x1 in cols:
                salvar(img, (x0, y0, x1, y1),
                       os.path.join(RAIZ, 'assets', 'fundos', FUNDOS[i] + '.png'))
                i += 1


if __name__ == '__main__':
    main()
