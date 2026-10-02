import { View, Text } from 'react-native';
import { role, type RoleId } from '@jogo/engine';
import { corDaFaccao } from './Motivo';
import { IconeDeRole, IconeDeRoleVivo } from './IconeDeRole';
import { Material } from './Ambiente';
import { cores, espaco, tipografia } from '../theme';

/**
 * A tinta da carta.
 *
 * A carta INVERTE a regra de cor do resto do app, e de propósito. Em toda outra
 * tela o texto é claro sobre Fuligem, porque o app é usado no escuro. Aqui o
 * objeto citado é uma carta de papel, e carta de papel tem tinta escura sobre
 * papel claro — é o que a torna reconhecível como coisa, e não como painel.
 *
 * O papel é envelhecido (`#4A3A2C` sob a textura) justamente para não virar
 * clarão na mesa: a identidade reduz o brilho nas fases noturnas, e uma carta
 * branca acesa no escuro fere o olho e ilumina o rosto de quem está agindo.
 */
/**
 * O nome da facção como se ESCREVE, e não como se guarda.
 *
 * `r.faccao` é um id — `'solitario'`, sem acento, porque chave de dado não
 * leva acento. Imprimir o id no rodapé da carta deixava "SOLITARIO" na cara de
 * quem joga.
 */
const FACCAO_ESCRITA: Record<string, string> = {
  vila: 'vila',
  lobos: 'lobos',
  solitario: 'solitário',
};

const TINTA = '#160F0A';
const TINTA_FRACA = '#3B2A1D';

/**
 * A carta de role.
 *
 * Da especificação da seção 9 da identidade, o que está aplicado aqui é a
 * proporção 3:4, o motivo no topo e o nome em serifada. É uma tela de MOMENTO —
 * por isso tem textura e tremulação no motivo, que em tela de operação seriam
 * proibidas.
 *
 * O que a seção 9 pede e AINDA NÃO existe, para não ser redescoberto como
 * dúvida: a **moldura interna a 9px**. Ela já esteve aqui e foi retirada
 * durante a virada de direção visual; sobrou por um tempo uma `View` sem borda
 * nenhuma, que não desenhava nada e só confundia quem lesse o arquivo. Se a
 * moldura voltar, volta com `borderWidth` — não como marcação vazia.
 */
export function CartaDeRole({
  roleId,
  varianteId,
  largura = 240,
  viva = true,
}: {
  roleId: RoleId;
  varianteId?: string | undefined;
  largura?: number;
  /** `false` no catálogo, onde tremulação em lista vira ruído. */
  viva?: boolean;
}) {
  const r = role(roleId);
  const variante = varianteId ? r.variantes.find((v) => v.id === varianteId) : undefined;
  const cor = corDaFaccao(roleId);
  const Icone = viva ? IconeDeRoleVivo : IconeDeRole;

  return (
    <View
      /*
       * A carta precisa ler como OBJETO, e não como um retângulo pintado no
       * fundo. Três coisas fazem isso, e nenhuma é enfeite:
       *
       * - o corpo é mais claro que a tela, não igual: papel velho sobre madeira
       *   escura, que é a cena real que está sendo citada;
       * - a sombra projetada levanta a carta do fundo — é o único lugar do app
       *   com sombra, porque é o único lugar com um objeto solto;
       * - a textura de papel entra quase cheia (0.9). Aqui pode: é tela de
       *   MOMENTO, e a identidade só proíbe textura em tela de operação.
       */
      style={{
        width: largura,
        height: largura * (4 / 3),
        backgroundColor: '#4A3A2C',
        borderRadius: 4,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOpacity: 0.55,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 7 },
        elevation: 10,
      }}
    >
      {/*
        O papel COBRE em vez de ladrilhar, e sem raio próprio.
        Duas correções, as duas de borda:

        - `ladrilho` desenhava a emenda da amostra dentro da carta. Enquanto o
          arquivo da textura carregou uma tira da calha branca da folha de
          contato, essa emenda virou uma linha branca em cima, embaixo e nas
          laterais. A tira foi removida no `scripts/fatiar-assets.py`
          (`aparar_borda`), mas a emenda continuava existindo como
          descontinuidade — numa carta só cabe pouco mais de uma amostra.
        - `raio={20}` contra o `borderRadius: 4` da carta deixava uma meia-lua
          do corpo escuro aparecendo em cada canto. A carta já recorta os
          filhos com `overflow: 'hidden'`, então o papel não precisa de raio.
      */}
      <Material material="papel" opacidade={0.9} modo="cobrir" />

      {/*
        A carta tem ALTURA FIXA (3:4) e `overflow: 'hidden'`, então tudo que não
        couber é cortado em silêncio — foi o que aconteceu com "Sobrevivente
        Invisível", "Bobo Desesperado" e qualquer variante de nome comprido ou
        descrição de três frases.

        A correção é dar a cada bloco o seu espaço em vez de empilhar e torcer:
        o motivo tem tamanho proporcional e não cresce, o nome tem no máximo
        duas linhas, e a descrição fica num bloco elástico que absorve o que
        sobra. `numberOfLines` corta com reticências, que é honesto — o texto
        inteiro está na Biblioteca. Cortar no meio de uma palavra, sem aviso,
        não é.
      */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingHorizontal: espaco.md,
          paddingTop: espaco.md,
          gap: espaco.xs,
        }}
      >
        <Icone roleId={roleId} varianteId={varianteId} tamanho={largura * 0.33} cor={cor} />

        {/*
          A FUNÇÃO vem primeiro, e grande. A variante vem embaixo.

          Relatado depois de uma mesa de verdade: a pessoa lê "Boca Calada" e
          não faz ideia do que aquilo é — nem sempre ela conhece as 24 funções.
          A variante é um AJUSTE sobre uma função, e ler o ajuste antes da coisa
          ajustada é ler a frase de trás para frente.

          Por isso a carta inverteu: nome da função em serifada grande, nome da
          variante logo abaixo em corpo menor, e as DUAS descrições — primeiro o
          que a função faz, depois o que esta variante muda.
        */}
        <Text
          numberOfLines={2}
          style={[
            tipografia.nomeDeRole,
            {
              color: TINTA,
              textAlign: 'center',
              fontSize: largura * (r.nome.length > 12 ? 0.095 : 0.11),
              lineHeight: largura * 0.125,
            },
          ]}
        >
          {r.nome}
        </Text>

        {variante && (
          <View style={{ alignItems: 'center', gap: 3 }}>
            <View style={{ width: largura * 0.22, height: 1, backgroundColor: TINTA_FRACA }} />
            <Text
              numberOfLines={2}
              style={[
                tipografia.nomeDeRole,
                {
                  color: cor,
                  textAlign: 'center',
                  fontSize: largura * (variante.nome.length > 16 ? 0.058 : 0.07),
                  lineHeight: largura * 0.08,
                },
              ]}
            >
              {variante.nome}
            </Text>
          </View>
        )}

        <View style={{ flex: 1, justifyContent: 'center', gap: espaco.xs }}>
          {/* O que a FUNÇÃO faz — a parte que a pessoa talvez não saiba. */}
          <Text
            numberOfLines={3}
            style={[
              tipografia.pequeno,
              {
                color: TINTA,
                textAlign: 'center',
                fontSize: largura * 0.05,
                lineHeight: largura * 0.066,
              },
            ]}
          >
            {r.descricaoCurta}
          </Text>

          {/* O que ESTA variante muda. Só aparece quando há variante. */}
          {variante && (
            <Text
              numberOfLines={4}
              style={[
                tipografia.pequeno,
                {
                  color: TINTA_FRACA,
                  textAlign: 'center',
                  fontStyle: 'italic',
                  fontSize: largura * 0.044,
                  lineHeight: largura * 0.058,
                },
              ]}
            >
              {variante.descricao}
            </Text>
          )}
        </View>
      </View>

      {/* Rodapé: a facção, como no verso de uma carta de verdade. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: espaco.lg,
          paddingTop: espaco.xs,
          paddingBottom: espaco.sm,
          marginHorizontal: espaco.md,
          borderTopWidth: 1,
          borderTopColor: 'rgba(22, 15, 10, 0.18)',
        }}
      >
        {/*
          Um fio separando o rodapé do corpo. Sem ele a facção encostava na
          descrição e a carta virava um bloco só de texto — "tudo meio junto",
          nas palavras de quem jogou.
        */}
        <Text
          style={[
            tipografia.rotulo,
            { color: cores.nogueiraTexto, fontSize: Math.max(10, largura * 0.05), letterSpacing: 1.5 },
          ]}
        >
          {FACCAO_ESCRITA[r.faccao]}
        </Text>
      </View>
    </View>
  );
}
