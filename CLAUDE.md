# Projeto Werewolf

## PARE. Leia isto primeiro.

Antes de qualquer análise, edição ou resposta neste repositório, **leia**:

### [`docs/LEITURA_OBRIGATORIA_PARA_IAS.md`](docs/LEITURA_OBRIGATORIA_PARA_IAS.md)

É o canal de troca de conhecimento entre as IAs que trabalham aqui. Contém a
causa-raiz de todos os defeitos já resolvidos, as decisões de projeto com o
porquê, as armadilhas das ferramentas, as preferências do usuário e o registro
de sessões.

**Não é opcional e não é documentação de produto — é memória operacional.**
Quase tudo que parece estranho neste repositório tem explicação lá, e mexer sem
ler já custou dias de trabalho refeito.

## E antes de encerrar a sessão

**Escreva no mesmo arquivo**, na seção 12 (Registro de sessões): o que mudou, o
que quebrou, a causa-raiz do que você perseguiu, o que tentou e não funcionou, e
o que ficou para trás.

Acrescente; não reescreva. Se algo virou mentira, marque `SUPERADO em <data>:` na
linha antiga e escreva a verdade nova abaixo.

> Toda sessão **lê** antes de agir e **escreve** antes de encerrar.
> Quem não escreve faz a próxima sessão pagar de novo a mesma conta.

## O básico, para você não precisar procurar

- Jogo de dedução social presencial, pass-and-play, Android, offline. Português.
- `packages/engine` é TypeScript puro — **zero React Native, zero DOM**.
- `pnpm run setup` prepara o ambiente e explica o que falta. Não é `pnpm setup`.
- `pnpm dev:lab` (engine no navegador) · `pnpm dev:web` (app no navegador) ·
  `pnpm dev:android` (aparelho por cabo) · `pnpm test` · `pnpm typecheck`.
- Não commite sem o usuário pedir. Não instale nada sem perguntar.
