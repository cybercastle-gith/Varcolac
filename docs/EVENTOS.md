# Os eventos — 13, todos de sorte

Estado depois da peneira de **2026-09-25**.

## O que mudou nessa peneira

- **Cortados:** Ossos na Encruzilhada, Fogo-fátuo, Presságio.
- **A família `gatilho` deixou de existir.** Todos os eventos são sorteados.
- **O evento é ANUNCIADO numa noite e VIGORA na seguinte.** A mesa ouve a
  ameaça no amanhecer e tem o dia inteiro para discutir o que fazer.
- **No máximo 2 eventos por partida** (`MAXIMO_DE_EVENTOS`, em `02-evento.ts`).
- Consequência: **a noite 1 nunca tem evento em vigor** — não houve amanhecer
  antes dela para anunciar nada.

Frequência (no setup): Desligado `0%` · Raro `20%` · **Frequente `45%`
(padrão)** · Caótico `80%`. A chance é por noite, até o teto de 2.

---

## Os 13

| # | Evento | Visibilidade | O que faz na noite em que vigora | Anúncio (lido em voz alta no amanhecer) |
|---|---|---|---|---|
| 1 | **Névoa Cerrada** | silencioso | A Vidente não enxerga nada | — não é dito |
| 2 | **Lua Cheia** | narrado | A matilha mata **dois** | *A lua está inteira. Eles não vão se conter.* |
| 3 | **Noite Sem Lua** | narrado | A matilha **não mata** | *Nada se moveu. Isso é pior.* |
| 4 | **Chuva de Sangue** | narrado | Todas as proteções falham | *Choveu vermelho sobre os telhados.* |
| 5 | **Sono Pesado** | narrado | Nenhum poder funciona; só a matilha age | *A vila dormiu fundo demais.* |
| 6 | **Caça às Bruxas** | narrado | No dia seguinte a vila lincha **dois** | *A vila perdeu a paciência. Amanhã, duas cordas.* |
| 7 | **Motim** | narrado | Aldeões perdem o voto por um dia | *Ninguém mais confia no julgamento da vila.* |
| 8 | **Luto Sagrado** | narrado | Proteção coletiva por uma noite | *A vila velou o corpo a noite toda.* |
| 9 | **Sede de Sangue** | narrado | A matilha é obrigada a matar dois | *Eles ficaram tempo demais com fome.* |
| 10 | **Velório** | narrado | Sem votação no dia seguinte | *Dois caixões. Ninguém tem estômago para julgar hoje.* |
| 11 | **A Corda Escolhe** | narrado | Empate na votação vai a sorteio | *A corda não espera a vila decidir.* |
| 12 | **Delação** | narrado | Revela a facção de quem votar em si mesmo | *Quem se acusa sozinho acaba dizendo mais do que queria.* |
| 13 | **Vingança dos Ossos** | narrado | Os mortos escolhem o próximo evento | *Os mortos já são muitos, e agora escolhem.* |

---

## ATENÇÃO — três deles ainda não fazem nada

Isto é anterior à peneira e não foi criado por ela: **os efeitos de 11, 12 e 13
não são lidos por nenhum código.**

| Evento | Efeito declarado | Quem deveria ler | Estado |
|---|---|---|---|
| A Corda Escolhe | `desempata-por-sorteio` | `day/voting.ts` | **não lê** |
| Delação | `revela-faccao` | `day/voting.ts` | **não lê** |
| Vingança dos Ossos | `mortos-escolhem-evento` | `02-evento.ts` | **não lê** |

O `switch` em `02-evento.ts` tem os três como casos vazios, com um comentário
dizendo "votação" e "próxima noite" — mas o `voting.ts` nunca consultou o evento
da noite, e o sorteio do próximo evento nunca perguntou aos mortos.

Hoje eles são anunciados à mesa, gastam uma das duas vagas de evento da partida,
e **não acontecem**. Com o teto de 2, isso é metade dos eventos de uma partida
podendo ser vazios.

**Decida:** ou eles são implementados (os dois de votação são pequenos; o dos
mortos precisa de desenho — quem decide, como, e o que acontece se discordarem),
ou saem da lista. Enquanto não decidir, o teto de 2 favorece cortá-los.

---

## Detalhe técnico

- Os eventos vivem em `packages/engine/src/data/events/`. O arquivo
  `gatilho.ts` manteve o nome mas **não tem mais gatilho nenhum** — os oito de
  lá agora são sorte, como os cinco de `sorte.ts`. Vale renomear quando alguém
  passar por ali.
- Cortar um evento é apagar o objeto: nenhum código depende de um id específico.
- O teto é `MAXIMO_DE_EVENTOS` em `resolution/steps/02-evento.ts`.
- Um teste garante que todo evento narrado tem narração e que todos são da
  família `sorte` (`resolution/evento.test.ts`).
