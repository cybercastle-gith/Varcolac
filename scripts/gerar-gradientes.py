# -*- coding: utf-8 -*-
"""
Gera as rampas de luz e sombra do app como PNG.

Por que como arquivo, e nao com Views empilhadas nem com expo-linear-gradient:

- Views empilhadas sao o que existia antes, e aparecem na tela: dois circulos
  grandes de borda dura em vez de uma queda continua. A identidade proibe
  justamente "halo perfeito" e "degrade suave e longo" — ela pede a queda ao
  QUADRADO da distancia, que nenhuma faixa de View reproduz.
- expo-linear-gradient e modulo nativo: entraria um `expo run:android` inteiro
  de novo no caminho, e ainda assim nao faz queda radial fisica.
- Um PNG de canal alfa faz as duas coisas de graca, e o `tintColor` do RN
  colore o mesmo arquivo com a cor de cada fase da partida.

As rampas sao branco puro com alfa variavel. A cor entra em tempo de execucao.
"""
import math
import os

from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'apps', 'mobile', 'assets', 'gradientes')


def suavizar(t):
    """Smoothstep: tira o serrilhado das pontas que uma rampa linear deixa."""
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def halo(tamanho=512, raio_do_nucleo=0.13):
    """
    A chama: queda ao quadrado da distancia.

    `raio_do_nucleo` e a distancia (em fracao do raio total) em que a luz cai
    pela metade. Pequeno de proposito — e o que produz "o centro e claro e a
    borda e preta em poucos centimetros" em vez de uma bola de brilho.
    """
    img = Image.new('LA', (tamanho, tamanho), (255, 0))
    px = img.load()
    centro = (tamanho - 1) / 2.0
    for y in range(tamanho):
        for x in range(tamanho):
            d = math.hypot(x - centro, y - centro) / centro
            if d >= 1.0:
                continue
            # Inverso do quadrado, normalizado para 1 no centro.
            i = 1.0 / (1.0 + (d / raio_do_nucleo) ** 2)
            # Corta a cauda longa: sem isso sobra um veu por toda a tela, que e
            # o "degrade suave e longo" que o documento recusa.
            i *= suavizar((1.0 - d) / 0.55)
            px[x, y] = (255, int(round(i * 255)))
    return img


def vinheta(largura=64, altura=1024, comeco=0.42, teto=0.9):
    """
    A sombra de baixo.

    Antes eram duas faixas chapadas (38% a 55% e 16% a 75%), e o resultado era
    uma borda visivel e um rodape preto morto — justo onde mora o botao
    principal. Aqui a sombra sobe continua e para em `teto`, deixando o rodape
    escuro mas ainda legivel.
    """
    img = Image.new('LA', (largura, altura), (255, 0))
    px = img.load()
    for y in range(altura):
        t = (y / (altura - 1) - comeco) / (1.0 - comeco)
        a = int(round(suavizar(t) * teto * 255))
        for x in range(largura):
            px[x, y] = (255, a)
    return img


def veu_de_topo(largura=64, altura=512, teto=0.55):
    """Escurece o topo, onde fica a barra de status e o cabecalho."""
    img = Image.new('LA', (largura, altura), (255, 0))
    px = img.load()
    for y in range(altura):
        a = int(round(suavizar(1.0 - y / (altura - 1)) * teto * 255))
        for x in range(largura):
            px[x, y] = (255, a)
    return img


def main():
    os.makedirs(SAIDA, exist_ok=True)
    for nome, img in [
        ('halo.png', halo()),
        ('vinheta.png', vinheta()),
        ('topo.png', veu_de_topo()),
    ]:
        img.convert('RGBA').save(os.path.join(SAIDA, nome))
        print('  ' + nome)


if __name__ == '__main__':
    main()
