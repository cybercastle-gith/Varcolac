"""
Gera os ícones de placeholder do app a partir da paleta Luz de Vela.

Um losango Garança sobre Fuligem — o motivo de bordado da seção 7 do documento
de identidade visual, que é justamente o que precisa funcionar a 48px.

Não é o ícone final: o ícone final sai do banco de materiais fotografados.
Isto existe para que `expo prebuild` produza um APK com a cara certa desde já.

Uso:  python scripts/gerar-icones.py
"""

import shutil
import struct
import zlib
from pathlib import Path

FULIGEM = (0x14, 0x10, 0x0D)
GARANCA = (0xA3, 0x26, 0x20)
CERA = (0xE0, 0xB7, 0x5C)

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "assets" / "icons"
# O app precisa dos assets DENTRO de apps/mobile: o Expo Go não serve arquivos
# de fora da pasta do projeto ("Unable to resolve manifest assets").
DESTINO_APP = RAIZ / "apps" / "mobile" / "assets"


def png(caminho: Path, largura: int, altura: int, pixel) -> None:
    """Escreve um PNG RGB sem dependência externa."""
    linhas = bytearray()
    for y in range(altura):
        linhas.append(0)  # filtro "None"
        for x in range(largura):
            linhas.extend(pixel(x, y))

    def bloco(tipo: bytes, dados: bytes) -> bytes:
        return (
            struct.pack(">I", len(dados))
            + tipo
            + dados
            + struct.pack(">I", zlib.crc32(tipo + dados) & 0xFFFFFFFF)
        )

    cabecalho = struct.pack(">2I5B", largura, altura, 8, 2, 0, 0, 0)
    caminho.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + bloco(b"IHDR", cabecalho)
        + bloco(b"IDAT", zlib.compress(bytes(linhas), 9))
        + bloco(b"IEND", b"")
    )


def losango(tamanho: int, fundo, traco, escala: float = 0.34, espessura: float = 0.055):
    """Losango vazado, centrado. Traço de peso único, como manda o sistema."""
    centro = tamanho / 2
    raio = tamanho * escala
    faixa = tamanho * espessura

    def pixel(x: int, y: int):
        d = abs(x + 0.5 - centro) + abs(y + 0.5 - centro)
        return traco if abs(d - raio) <= faixa else fundo

    return pixel


def main() -> None:
    DESTINO.mkdir(parents=True, exist_ok=True)

    png(DESTINO / "icon.png", 1024, 1024, losango(1024, FULIGEM, GARANCA))
    # O adaptativo do Android recorta as bordas: o motivo entra menor.
    png(
        DESTINO / "adaptive-icon.png",
        1024,
        1024,
        losango(1024, FULIGEM, GARANCA, escala=0.24, espessura=0.04),
    )
    png(DESTINO / "splash.png", 1242, 1242, losango(1242, FULIGEM, CERA, escala=0.18))
    png(DESTINO / "favicon.png", 48, 48, losango(48, FULIGEM, GARANCA))

    DESTINO_APP.mkdir(parents=True, exist_ok=True)
    for f in sorted(DESTINO.glob("*.png")):
        shutil.copy2(f, DESTINO_APP / f.name)
        # Sem seta unicode: o console do Windows usa cp1252 e quebraria.
        print(f"{f.relative_to(RAIZ)}  {f.stat().st_size} bytes  ->  {(DESTINO_APP / f.name).relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
