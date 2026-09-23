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
export function CartaDeRole({ roleId, varianteId, largura = 240, viva = true }: {
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

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: espaco.lg,
          gap: espaco.sm,
        }}
      >
        {/* Amplia o motivo para esconder eventuais bordas claras da imagem. */}
        <Icone roleId={roleId} varianteId={varianteId} tamanho={largura * 0.48} cor={cor} />

        <Text
          style={[
            tipografia.nomeDeRole,
            { color: TINTA, textAlign: 'center', fontSize: largura * 0.11 },
          ]}
        >
          {variante?.nome ?? r.nome}
        </Text>

        {variante && (
          <Text style={[tipografia.rotulo, { color: cor, fontSize: 9 }]}>{r.nome}</Text>
        )}

        <Text
          style={[
            tipografia.pequeno,
            { color: TINTA_FRACA, textAlign: 'center', fontSize: largura * 0.055 },
          ]}
        >
          {variante?.descricao ?? r.descricaoCurta}
        </Text>
      </View>

      {/* Rodapé: a facção, como no verso de uma carta de verdade. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: espaco.lg,
          paddingTop: espaco.sm,
          paddingBottom: espaco.md,
          marginHorizontal: espaco.md,
        }}
      >
        <Text style={[tipografia.rotulo, { color: cores.nogueira, fontSize: 14 }]}>{r.faccao}</Text>
      </View>
    </View>
  );
}
