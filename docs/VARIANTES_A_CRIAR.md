# Variantes a criar — prompt para outra IA

Este arquivo tem **um prompt pronto para colar**. Ele pede a outra IA as
variantes que faltam nas 17 funções que ainda não têm nenhuma.

Abaixo do prompt ficam as notas de quem vai **receber** a resposta: o que
conferir antes de colar no código.

---

## Estado atual — 22 variantes em 7 funções, 17 funções sem nenhuma

| Função | Facção | Peso | Variantes |
|---|---|---|---|
| Aldeão | vila | 0 | **3** — Herdeiro, Teimoso, Testemunha |
| Vidente | vila | 3 | **4** — do Espelho, dos Sonhos, dos Ossos, Confusa |
| Detetive | vila | 3 | **3** — Obsessivo, Cansado, Delegado |
| Médico | vila | 3 | **3** — de Guerra, de Plantão, Curandeiro |
| Guarda-costas | vila | 3 | **3** — Sacrifício, Escudo, Muralha |
| Padre | vila | 2 | **3** — Exorcista, Sino da Igreja, Mártir |
| Caçador | vila | 2 | **3** — Armadilha, Último Uivo, Vingativo |
| **Xerife** | vila | 3 | — |
| **Necromante** | vila | 4 | — |
| **Taverneiro** | vila | 1 | — |
| **Anciã** | vila | 2 | — |
| **Lobo** | lobos | 3 | — |
| **Alfa** | lobos | 4 | — |
| **Feiticeiro** | lobos | 4 | — |
| **Lobo Carniçal** | lobos | 4 | — |
| **Lobo Sombra** | lobos | 3 | — |
| **Uivador** | lobos | 3 | — |
| **Lobo Branco** | lobos | 2 | — |
| **Bruxa** | solitário | 3 | — |
| **Ladrão** | solitário | 2 | — |
| **Coringa** | solitário | 2 | — |
| **Sobrevivente** | solitário | 1 | — |
| **Bobo** | solitário | 1 | — |
| **Vingador** | solitário | 1 | — |

O desequilíbrio é gritante: **a vila tem todas as variantes e os lobos não têm
nenhuma**. Quem monta baralho hoje tem profundidade de um lado só.

---

# O PROMPT — copie daqui até o fim do bloco

```
Você vai escrever VARIANTES para as funções de um jogo de dedução social
presencial (tipo Lobisomem/Werewolf), pass-and-play num celular só, que circula
pela mesa. O app é o mestre: distribui, narra, resolve e conta votos.

Preciso de 3 variantes para cada uma das 17 funções listadas no fim.

## O que é uma variante, neste jogo

Uma variante é um SABOR da função base, escolhido no setup. Ela não é uma
função nova: quem pega a carta continua sendo "o Médico", mas um Médico que
funciona de um jeito diferente. O ícone é o mesmo da função base, com um
pequeno complemento geométrico no canto.

Regra que decide tudo: **a variante troca UMA coisa na função base.** Se você
precisa de dois parágrafos para explicar, virou função nova — recomece.

## O contrato técnico (TypeScript) — obedeça exatamente

```ts
interface RoleVariant {
  id: string;          // kebab-case, sem acento. Único dentro da função.
  nome: string;        // como aparece na carta. Pode ter acento.
  descricao: string;   // UMA frase. É o que o jogador lê no escuro, com pressa.
  peso: number;        // ABSOLUTO: substitui o peso da base, não soma.
  etapa?: NightStepId; // só se a variante MUDA o momento da ação
  usoLimitado?:
    | { kind: 'ilimitado' }
    | { kind: 'por-partida'; total: number }
    | { kind: 'noites-alternadas'; paridade: 'impar' | 'par' };
}
```

`NightStepId` é uma destas onze, nesta ordem fixa de resolução:

```
estado-inicial · evento · bloqueio · interferencia-espectral · protecao ·
perfuracao · ataque · resolucao-mortes · estertores · ressurreicao · informacao
```

A ordem é precedência real. Exemplos do que ela já resolve sozinha:
- `bloqueio` acontece antes de `protecao`, então bloquear o Médico anula a cura.
- `perfuracao` acontece entre `protecao` e `ataque`: é como o Feiticeiro dos
  lobos fura uma cura individual.
- `informacao` é a ÚLTIMA e lê o estado do INÍCIO da noite — investigar quem
  morreu naquela noite ainda devolve a facção, para a informação não vazar o
  resultado.
- `estertores` dispara com morte por QUALQUER causa, inclusive linchamento.

## Peso: o que o número significa

O peso alimenta uma calculadora de equilíbrio. Referências reais do jogo:

```
0  Aldeão (nenhuma habilidade)        3  Vidente, Médico, Xerife, Lobo
1  Taverneiro, Sobrevivente, Bobo     4  Necromante, Alfa, Feiticeiro
2  Padre, Caçador, Anciã, Ladrão
```

Calibragem de variante, em relação à base:
- mesma força → mesmo peso;
- enfraquece (uso limitado, informação suja, atraso) → **base − 1**;
- fortalece (alcança dois, atravessa proteção, também de dia) → **base + 1**;
- peso 5 ou mais não existe neste jogo. Se sua variante pede 5, ela é forte
  demais para ser variante.

## As alavancas que produzem variante boa

Cada uma troca UMA coisa. Use-as; não invente mecânica nova.

1. **Alcance** — age sobre dois alvos em vez de um.
2. **Frequência** — uma vez por partida, ou só em noites ímpares.
3. **Atraso** — o efeito acontece na noite seguinte, não nesta.
4. **Publicidade** — o resultado é anunciado à mesa inteira, não em segredo.
5. **Ruído** — a informação chega errada, ou incompleta, ou sem saber de quem.
6. **Custo** — ganha poder e paga com voto, com vida, ou com revelar-se.
7. **Momento** — a ação muda de etapa (mexa em `etapa`).
8. **Condição** — só funciona se algo for verdade (alguém morreu, é noite 1...).

## Regras duras — quebrar qualquer uma reprova a variante

- **Uma frase na `descricao`.** O jogador lê no escuro, com gente esperando.
  Sem "além disso", sem ponto e vírgula encadeando duas regras.
- **Nada que exija digitar texto livre.** O aparelho passa de mão em mão; toda
  ação é toque em nome de jogador ou botão.
- **Nada de comunicação secreta entre jogadores pelo app.** Já houve uma
  mecânica de bilhete anônimo e ela foi CORTADA do jogo. Não a ressuscite.
- **Nada que dependa de ordem de assento, de tempo real, ou de contar segundos.**
- **A variante não pode trocar a facção da função.** Lobo continua lobo.
- **Nada que force o app a revelar quem é quem fora das regras já existentes.**
- **Evite espelhar uma variante que já existe em outra função.** "de Guerra"
  (alcança dois) e "de Plantão" (atrasa) já estão usados no Médico — para o
  Xerife, ache outra alavanca.

## O tom da escrita

Ambientação: Leste europeu e Bálcãs, século XIX, cultura camponesa real.
Nomes curtos e concretos, do mundo da vila: ofício, parentesco, objeto,
condição. **Nada de fantasia genérica** — sem "Sombrio", "Arcano", "das Trevas",
"Supremo", "Maldito". Compare com os nomes que já existem e que funcionam:
Herdeiro, Teimoso, Testemunha, Vidente dos Ossos, Médico de Plantão, Sino da
Igreja, Mártir, Último Uivo.

## Exemplo real, do código do jogo — siga este padrão

Função base: **Padre** (vila, peso 2, etapa `protecao`, uma vez por partida).
"Uma vez por partida, anula todas as mortes da noite."

```ts
variantes: [
  {
    id: 'sino',
    nome: 'Sino da Igreja',
    descricao: 'Uma vez por partida, cancela a votação do dia seguinte.',
    peso: 2,
    usoLimitado: { kind: 'por-partida', total: 1 },
  },
  {
    id: 'martir',
    nome: 'Mártir',
    descricao:
      'Marca um protegido à noite. Se ele for condenado no dia seguinte, o ' +
      'Mártir morre no lugar, automaticamente.',
    peso: 3,
  },
],
```

Repare: o Sino move a proteção da noite para o dia (alavanca 7, mesmo peso); o
Mártir troca proteção por sacrifício condicional e sobe para 3.

## As 17 funções, com o que cada uma faz hoje

VILA
- xerife (peso 3, etapa bloqueio): Prende um jogador — ele não age, não morre e
  não fala no dia seguinte.
- necromante (peso 4, etapa ressurreicao, 1x por partida): Ressuscita um morto
  de noites anteriores.
- taverneiro (peso 1, etapa bloqueio): Embebeda um jogador; o poder dele falha e
  ele não é avisado.
- ancia (peso 2, passiva): Se morrer por qualquer causa, a vila perde todos os
  poderes por uma noite.

LOBOS
- lobo (peso 3, etapa ataque): Mata com a matilha.
- alfa (peso 4, etapa ataque, 1x por partida): Converte em vez de matar.
- feiticeiro (peso 4, etapa perfuracao, 1x por partida): O ataque da matilha
  atravessa curas e imunidades.
- lobo-carnical (peso 4, etapa estertores): Ao ser morto não morre na hora: mata
  alguém e só expira na noite seguinte.
- lobo-sombra (peso 3, etapa informacao): Escolhe uma noite para ficar imune a
  investigação.
- uivador (peso 3): Revela publicamente um lobo — ou a si mesmo.
- lobo-branco (peso 2, etapa ataque): Mata lobos também. Pode vencer sozinho ou
  com a matilha.

SOLITÁRIOS
- bruxa (peso 3, etapa protecao/ataque, 1 uso): Escolhe no início entre poção da
  vida ou da morte.
- ladrao (peso 2, etapa estado-inicial): Na noite 1 troca de função com outro.
- coringa (peso 2): Recebe uma missão sorteada e secreta a cada partida.
- sobrevivente (peso 1, passiva): Estar vivo no fim. Vence com qualquer vencedor.
- bobo (peso 1, vitória própria): Ser linchado pela vila.
- vingador (peso 1, vitória própria): Escolhe um alvo na noite 1 e vence se ele
  morrer, por qualquer causa.

## O que entregar

Para cada uma das 17 funções, **3 variantes**, no formato:

### <id da função> — <Nome>

```ts
variantes: [
  { id: '...', nome: '...', descricao: '...', peso: N },
  ...
]
```

E, embaixo de cada função, **uma linha por variante** explicando qual das 8
alavancas você usou e por que o peso é aquele. Sem isso eu não consigo revisar.

Não escreva introdução nem conclusão. Comece na primeira função.
```

---

## Notas para quem vai receber a resposta

Antes de colar qualquer coisa em `packages/engine/src/data/roles/`:

1. **`id` sem acento e sem espaço**, kebab-case. Ele vira chave em
   `variantes[roleId]` na config da partida e nome de complemento em
   `motivos.ts`.
2. **Peso é absoluto.** `pesoEfetivo()` SUBSTITUI o peso base — não soma.
   Variante com peso ausente ou somado quebra o índice de equilíbrio.
3. **Toda variante nova precisa de complemento no `motivos.ts`**, senão o ícone
   dela fica igual ao da base. Já existem quatro prontos para reaproveitar:
   `MENOS` (enfraquecido), `DUPLO` (alcança dois), `ATRASO` (acontece depois),
   `PUBLICO` (a mesa toda vê). Se a alavanca for uma dessas, use o que existe.
4. **Variante que muda `etapa` muda precedência.** Confira contra as 11 etapas
   antes de aceitar: mover algo para antes de `bloqueio` ou depois de
   `informacao` costuma quebrar invariante.
5. **Rode `pnpm test` e `pnpm typecheck`.** O catálogo tem teste próprio
   (`data/roles/catalogo.test.ts`), e `pesoEfetivo` lança se a variante não
   existir na base.
6. **Depois de aplicar, recalibre.** A calculadora de peso
   (`balance/weight-calculator.ts`) está em `M = 2.6` e foi medida com o
   catálogo atual. Variantes novas mudam a distribuição de baralho —
   `simulation/calibragem.ts` é o caminho.
7. **Amantes não existe mais** (removido em 2026-09-22, junto com o conceito de
   "modificador"). Se a resposta citar Amantes, ignore essa parte.
