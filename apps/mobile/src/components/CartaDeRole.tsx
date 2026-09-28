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
  const nome = variante?.nome ?? r.nome;
  const descricao = variante?.descricao ?? r.descricaoCurta;

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
        <Icone roleId={roleId} varianteId={varianteId} tamanho={largura * 0.36} cor={cor} />

        {/*
          O nome encolhe quando é comprido, em vez de sumir.

          "Sobrevivente Invisível" tem 22 caracteres contra os 5 de "Bobo": com
          um tamanho único, ou o curto fica minúsculo ou o comprido estoura.
          A escala é por FAIXA e não contínua — três degraus são previsíveis de
          conferir, uma fórmula contínua dá um tamanho diferente por carta.
        */}
        <Text
          numberOfLines={2}
          style={[
            tipografia.nomeDeRole,
            {
              color: TINTA,
              textAlign: 'center',
              fontSize: largura * (nome.length > 18 ? 0.082 : nome.length > 12 ? 0.095 : 0.11),
              lineHeight: largura * (nome.length > 18 ? 0.1 : 0.125),
            },
          ]}
        >
          {nome}
        </Text>

        {/*
          A função de origem, quando a carta é uma variante.

          Era `fontSize: 9` fixo — ilegível numa carta de 200px e perdido numa
          de 300. E é a informação que responde "isto é um quê?": sem ela,
          "Boca Calada" não diz a ninguém que é um Xerife.
        */}
        {variante && (
          <View style={{ alignItems: 'center', gap: 2 }}>
            <View style={{ width: largura * 0.18, height: 1, backgroundColor: TINTA_FRACA }} />
            {/*
              TINTA, e não a cor da facção.

              `corDaFaccao` é feita para brilhar sobre Fuligem; sobre o papel
              claro da carta ela vira um borrão dourado ilegível — e esta é
              justamente a linha que responde "Boca Calada é um quê?". A carta
              inverte a regra de cor do app inteiro, e este rótulo tinha ficado
              de fora da inversão.
            */}
            <Text
              style={[
                tipografia.rotulo,
                { color: TINTA_FRACA, fontSize: Math.max(9, largura * 0.045), letterSpacing: 1.2 },
              ]}
            >
              {r.nome}
            </Text>
          </View>
        )}

        {/* O bloco elástico: absorve o que sobrar da altura, e só ele rola. */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text
            numberOfLines={descricao.length > 110 ? 5 : 4}
            style={[
              tipografia.pequeno,
              {
                color: TINTA_FRACA,
                textAlign: 'center',
                fontSize: largura * (descricao.length > 110 ? 0.046 : 0.053),
                lineHeight: largura * (descricao.length > 110 ? 0.062 : 0.07),
              },
            ]}
          >
            {descricao}
          </Text>
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
            { color: cores.nogueira, fontSize: Math.max(10, largura * 0.05), letterSpacing: 1.5 },
          ]}
        >
          {FACCAO_ESCRITA[r.faccao]}
        </Text>
      </View>
    </View>
  );
}
