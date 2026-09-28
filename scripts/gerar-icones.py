# -*- coding: utf-8 -*-
"""
Gera os ícones do app a partir da marca.

Por que um script e não três arquivos exportados à mão: os três ícones têm
regras DIFERENTES e conflitantes, e refazê-los à mão garante que um deles saia
errado na próxima vez.

- `icon.png` (1024): iOS e a loja. Fundo opaco Fuligem, porque iOS não aceita
  transparência e recorta o canto sozinho.
- `adaptive-icon.png` (1024): Android. Fundo TRANSPARENTE (o sistema aplica o
  `backgroundColor` do app.json) e a marca inteira dentro do círculo de
  segurança — o Android recorta em círculo, quadrado arredondado ou gota,
  dependendo do lançador, e o que passa de 66% do lado pode ser cortado.
- `favicon.png` (48): a aba do navegador. Fundo opaco, sem margem: a 48px
  qualquer respiro come o desenho.

Uso: python scripts/gerar-icones.py
"""

import os
import sys

from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(RAIZ, 'apps', 'mobile', 'assets')

MARCA = os.path.join(ASSETS, 'app-logo.png')
FULIGEM = (0x14, 0x10, 0x0D, 255)


def recortar_ao_conteudo(im):
    """Corta a moldura transparente, para a margem ser nossa e não do arquivo."""
    caixa = im.getbbox()
    return im.crop(caixa) if caixa else im


def encaixar(marca, lado, ocupacao):
    """A marca centrada num quadrado de `lado`, ocupando `ocupacao` dele."""
    alvo = int(lado * ocupacao)
    copia = marca.copy()
    copia.thumbnail((alvo, alvo), Image.LANCZOS)
    tela = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    tela.paste(
        copia,
        ((lado - copia.width) // 2, (lado - copia.height) // 2),
        copia,
    )
    return tela


def achatar(camada, fundo=FULIGEM):
    """Põe a camada sobre um fundo opaco. iOS e favicon não aceitam alfa."""
    tela = Image.new('RGBA', camada.size, fundo)
    tela.alpha_composite(camada)
    return tela.convert('RGB')


def main():
    if not os.path.exists(MARCA):
        print('não encontrei a marca em', MARCA)
        return 1

    marca = recortar_ao_conteudo(Image.open(MARCA).convert('RGBA'))
    print('marca recortada:', marca.size)

    # iOS / loja: 80% do quadrado, fundo opaco.
    achatar(encaixar(marca, 1024, 0.80)).save(os.path.join(ASSETS, 'icon.png'))

    # Android: 62% (dentro dos 66% de segurança), fundo transparente.
    encaixar(marca, 1024, 0.62).save(os.path.join(ASSETS, 'adaptive-icon.png'))

    # Navegador: cheio, fundo opaco. 48px não tem espaço para margem.
    achatar(encaixar(marca, 48, 0.94)).save(os.path.join(ASSETS, 'favicon.png'))

    for nome in ('icon.png', 'adaptive-icon.png', 'favicon.png'):
        caminho = os.path.join(ASSETS, nome)
        im = Image.open(caminho)
        print(nome, im.size, im.mode, os.path.getsize(caminho), 'bytes')
    return 0


if __name__ == '__main__':
    sys.exit(main())
